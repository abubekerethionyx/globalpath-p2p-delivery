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

    count = 0
    for sub in expired:
        sub.is_active = False
        count += 1
        print(f"Deactivated expired subscription for user {sub.user_id}")
    
    db.session.commit()
    print(f"Deactivation complete. total: {count}")

def run_system_maintenance():
    """Run all maintenance tasks"""
    print(f"--- System Maintenance Log: {datetime.utcnow()} ---")
    deactivate_expired_subscriptions()
    recalculate_rankings()
    print("--- Maintenance Session Finished ---")
