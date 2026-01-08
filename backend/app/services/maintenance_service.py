from datetime import datetime, timedelta
from app.extensions import db
from app.models.shipment import ShipmentItem
from app.models.subscription import SubscriptionTransaction, SubscriptionPlan
from app.models.user import User
from app.models.travel import Travel

def recalculate_rankings():
    """
    Algorithm to recalculate ranking scores for all POSTED shipments.
    Score = (Base Score) + (Premium Boost) - (Time Decay)
    """
    print("Starting ranking recalculation...")
    from app.models.enums import ItemStatus
    shipments = ShipmentItem.query.filter(ShipmentItem.status.in_(['POSTED', 'REQUESTED'])).all()
    now = datetime.utcnow()

    for item in shipments:
        score = 100.0 # Base score

        # 1. Premium Boost
        # Find if sender has an active premium subscription
        premium_sub = db.session.query(SubscriptionTransaction).join(SubscriptionPlan).filter(
            SubscriptionTransaction.user_id == item.sender_id,
            SubscriptionTransaction.is_active == True,
            SubscriptionPlan.is_premium == True,
            SubscriptionTransaction.end_date > now
        ).first()

        if premium_sub:
            score += 500.0 # Significant boost for premium users
            print(f"Applying premium boost to item {item.id}")

        # 2. Time Decay
        # Lose 10 points for every day since creation
        hours_old = (now - item.created_at).total_seconds() / 3600.0
        decay = (hours_old / 24.0) * 10.0
        score -= decay

        # 3. Randomness (Subtle jitter to keep things fresh)
        import random
        score += random.uniform(0, 5)

        item.ranking_score = max(0, score)
    
    db.session.commit()
    print("Ranking recalculation complete.")

def deactivate_expired_subscriptions():
    """
    Checks for subscriptions that have passed their end_date and sets them to inactive.
    """
    print("Checking for expired subscriptions...")
    now = datetime.utcnow()
    expired = SubscriptionTransaction.query.filter(
        SubscriptionTransaction.is_active == True,
        SubscriptionTransaction.end_date < now
    ).all()

    from app.models.notification import create_notification
    count = 0
    for sub in expired:
        sub.is_active = False
        sub.remaining_usage = 0 # Protocol reset: clear all remaining delivery slots
        count += 1
        
        # Broadcast termination notification to edge node
        create_notification(
            user_id=sub.user_id,
            title="Membership Protocol Terminated",
            message=f"Your {sub.plan_name or 'current'} plan has expired. Please re-subscribe or synchronize with a Premium tier to resume logistics operations.",
            type='WARNING',
            link='/packaging'
        )
        print(f"Deactivated expired subscription and notified user {sub.user_id}")
    
    db.session.commit()
    print(f"Deactivation complete. total: {count}")

def award_daily_activity_coins():
    """
    Awards technical credits to active users based on platform-defined settings.
    Active Sender = >= 1 active post in last 24h.
    Active Picker = >= 3 picked/approved/transit items.
    """
    from app.models.setting import GlobalSetting
    from app.services.user_service import reward_user_coins
    
    print("Initializing social currency distribution loop...")
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    # 1. Rewards for Active Senders
    sender_reward = int(GlobalSetting.get_value('reward_daily_active_sender', default=1))
    active_senders = db.session.query(ShipmentItem.sender_id).filter(
        ShipmentItem.created_at >= yesterday,
        ShipmentItem.status.in_(['POSTED', 'REQUESTED'])
    ).distinct().all()
    
    for (uid,) in active_senders:
        reward_user_coins(uid, sender_reward, "Standard Active Sender Reward")

    # 2. Rewards for High-Performance Pickers
    picker_reward = int(GlobalSetting.get_value('reward_daily_active_picker', default=5))
    # Find pickers with >= 3 items picked/approved in the last 24h
    active_pickers = db.session.query(ShipmentItem.partner_id).filter(
        ShipmentItem.partner_id.isnot(None),
        ShipmentItem.picked_at >= yesterday
    ).group_by(ShipmentItem.partner_id).having(db.func.count(ShipmentItem.id) >= 3).all()

    for (pid,) in active_pickers:
        reward_user_coins(pid, picker_reward, "High-Performance Picker Achievement (3+ items today)")
        
    print(f"Social currency distribution complete. Targets synchronized.")

def process_holiday_bonuses():
    """
    Checks if today is a public holiday in Ethiopia and awards a bonus to all users.
    Uses Nager.Date public API for holiday detection.
    """
    import requests
    from app.models.setting import GlobalSetting
    from app.constants import SETTING_HOLIDAY_BONUS_AMOUNT, SETTING_LAST_HOLIDAY_CHECK
    from app.models.notification import create_notification
    
    today = datetime.utcnow().date()
    today_str = today.isoformat()
    
    # Avoid duplicate checks/bonuses on the same day
    if GlobalSetting.get_value(SETTING_LAST_HOLIDAY_CHECK) == today_str:
        return
        
    print(f"Checking for public holidays on {today_str}...")
    
    try:
        holiday_name = None
        # Fetch Ethiopian holidays for the current year
        year = today.year
        # Protocol Note: We use the ET country code for GlobalPath's primary operations region
        response = requests.get(f"https://date.nager.at/api/v3/PublicHolidays/{year}/ET", timeout=10)
        
        if response.status_code == 200:
            holidays = response.json()
            holiday_today = next((h for h in holidays if h['date'] == today_str), None)
            if holiday_today:
                holiday_name = holiday_today['name']
        else:
            print(f"Holiday API returned status: {response.status_code}. Checking local fallback...")

        # Fallback local check for major Ethiopian fixed-date holidays
        if not holiday_name:
            if today.month == 1 and today.day == 7:
                holiday_name = "Genna (Ethiopian Christmas)"
            elif today.month == 1 and today.day == 19:
                holiday_name = "Timkat (Epiphany)"
            elif today.month == 3 and today.day == 2:
                holiday_name = "Adwa Victory Day"
            elif today.month == 5 and today.day == 1:
                holiday_name = "International Workers' Day"
            elif today.month == 5 and today.day == 5:
                holiday_name = "Patriots' Victory Day"
            elif today.month == 5 and today.day == 28:
                holiday_name = "Derg Downfall Day"
            elif today.month == 9 and today.day == 11:
                holiday_name = "Enkutatash (Ethiopian New Year)"
            elif today.month == 9 and today.day == 27:
                holiday_name = "Meskel"
        
        if holiday_name:
            print(f"National Holiday Detected: {holiday_name}! Initiating global reward sequence...")
            
            bonus_amount = int(GlobalSetting.get_value(SETTING_HOLIDAY_BONUS_AMOUNT, default=15))
            users = User.query.all()
            
            for user in users:
                user.coins_balance += bonus_amount
                create_notification(
                    user_id=user.id,
                    title=f"Happy {holiday_name}! 🎊",
                    message=f"To celebrate the holiday, we've awarded you {bonus_amount} technical credits. Protocol connectivity for all!",
                    type='SUCCESS',
                    link='/packaging'
                )
            
            # Sync settings to prevent re-processing
            GlobalSetting.set_value('current_holiday_protocol', holiday_name)
            print(f"Distributed {bonus_amount} coins to each of {len(users)} users for {holiday_name}.")
        
        # Mark today as checked regardless of whether it was a holiday or not
        GlobalSetting.set_value(SETTING_LAST_HOLIDAY_CHECK, today_str)
        db.session.commit()

    except Exception as e:
        print(f"Failed to process holiday bonuses: {str(e)}")

def cancel_expired_travels():
    """
    Automatically cancels (marks as COMPLETED) travels whose travel_date has passed.
    This keeps the travel feed clean and prevents users from pinning to expired travels.
    """
    print("Checking for expired travel posts...")
    now = datetime.utcnow()
    
    # Find all ACTIVE travels where the travel_date has passed
    expired_travels = Travel.query.filter(
        Travel.status == 'ACTIVE',
        Travel.travel_date < now
    ).all()
    
    from app.models.notification import create_notification
    count = 0
    
    for travel in expired_travels:
        travel.status = 'COMPLETED'
        count += 1
        
        # Notify the travel poster
        create_notification(
            user_id=travel.user_id,
            title="Travel Post Completed",
            message=f"Your travel from {travel.origin_country} to {travel.destination_country} has been automatically marked as completed since the travel date has passed.",
            type='INFO',
            link=f'/travel/{travel.id}'
        )
        print(f"Marked travel {travel.id} as COMPLETED (travel date: {travel.travel_date})")
    
    db.session.commit()
    print(f"Travel cleanup complete. Total expired travels processed: {count}")

def run_system_maintenance():
    """Run all maintenance tasks"""
    print(f"--- System Maintenance Log: {datetime.utcnow()} ---")
    deactivate_expired_subscriptions()
    recalculate_rankings()
    award_daily_activity_coins()
    process_holiday_bonuses()
    cancel_expired_travels()
    print("--- Maintenance Session Finished ---")
