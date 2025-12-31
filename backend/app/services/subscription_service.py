from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from app.extensions import db
from datetime import datetime, timedelta
import requests
from flask import current_app

# Plans
def get_all_plans():
    return SubscriptionPlan.query.all()

def create_plan(data):
    plan = SubscriptionPlan(**data)
    db.session.add(plan)
    db.session.commit()
    return plan

def update_plan(plan_id, data):
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return None
    for key, value in data.items():
        if hasattr(plan, key):
            setattr(plan, key, value)
    db.session.commit()
    return plan

def delete_plan(plan_id):
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return False
    db.session.delete(plan)
    db.session.commit()
    return True

# Transactions
def get_all_transactions():
    return SubscriptionTransaction.query.order_by(SubscriptionTransaction.timestamp.desc()).all()

def get_user_transactions(user_id):
    return SubscriptionTransaction.query.filter_by(user_id=user_id).order_by(SubscriptionTransaction.timestamp.desc()).all()

def _activate_subscription(transaction):
    user_id = transaction.user_id
    plan_id = transaction.plan_id
    
    # Deactivate previous subscriptions
    old_subs = SubscriptionTransaction.query.filter_by(user_id=user_id, is_active=True).all()
    for old in old_subs:
        old.is_active = False

    # Fetch Plan logic to get Limit
    plan = SubscriptionPlan.query.get(plan_id)
    if plan:
        transaction.remaining_usage = plan.limit
        transaction.is_active = True
        transaction.end_date = datetime.utcnow() + timedelta(days=30)
    
    # Update User
    from app.models.user import User
    user = User.query.get(user_id)
    if user:
        user.current_plan_id = plan_id
    
    db.session.commit()

def create_transaction(data):
    transaction = SubscriptionTransaction(**data)
    db.session.add(transaction)
    db.session.commit()
    
    # Auto-upgrade User Plan if Payment Completed
    if data.get('status') == 'COMPLETED':
        _activate_subscription(transaction)

    return transaction

def update_transaction_status(transaction_id, status):
    transaction = SubscriptionTransaction.query.get(transaction_id)
    if not transaction:
        return None
        
    transaction.status = status
    if status == 'COMPLETED':
        _activate_subscription(transaction)
    else:
        db.session.commit()
        
    return transaction

def initiate_chapa_payment(transaction, user, plan):
    try:
        headers = {
            "Authorization": f"Bearer {current_app.config['CHAPA_SECRET_KEY']}",
            "Content-Type": "application/json",
        }
        
        callback_url = current_app.config['CHAPA_CALLBACK_URL']
        return_url = current_app.config['CHAPA_RETURN_URL']

        # Split name into first and last
        name_parts = user.name.split() if user.name else ["User"]
        first_name = name_parts[0]
        last_name = name_parts[-1] if len(name_parts) > 1 else ""

        payload = {
            "amount": str(transaction.amount),
            "currency": "ETB",
            "email": user.email,
            "phone_number": user.phone_number,
            "first_name": first_name,
            "last_name": last_name,
            "tx_ref": transaction.transaction_reference,
            "callback_url": callback_url,
            "return_url": return_url,
            "customization[title]": f"GlobalPath: {plan.name}",
            "customization[description]": f"Subscription plan upgrade to {plan.name}",
        }
        
        resp = requests.post(f"{current_app.config['CHAPA_BASE_URL']}/transaction/initialize", json=payload, headers=headers, timeout=20)
        
        if resp.status_code >= 400:
            return None
        
        data = resp.json()
        if data.get('status') == 'success':
            return data.get('data', {}).get('checkout_url')
            
        return None
                
    except Exception:
        return None
