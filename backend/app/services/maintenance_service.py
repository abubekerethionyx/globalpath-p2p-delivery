from datetime import datetime, timedelta
from app.extensions import db
from app.models.shipment import ShipmentItem
from app.models.subscription import SubscriptionTransaction, SubscriptionPlan
from app.models.user import User

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

def run_system_maintenance():
    """Run all maintenance tasks"""
    print(f"--- System Maintenance Log: {datetime.utcnow()} ---")
    deactivate_expired_subscriptions()
    recalculate_rankings()
    award_daily_activity_coins()
    print("--- Maintenance Session Finished ---")
