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
        duration = getattr(plan, 'duration_days', 30) or 30
        transaction.end_date = datetime.utcnow() + timedelta(days=duration)
    
    # Update User
    from app.models.user import User
    user = User.query.get(user_id)
    if user:
        user.current_plan_id = plan_id
    
    db.session.commit()

    # Notify User
    from app.models.notification import create_notification
    create_notification(
        user_id=user_id,
        title="Protocol Upgrade Complete",
        message=f"Your node status has been upgraded to {plan.name if plan else 'Active'}. Resources have been allocated.",
        type='SUCCESS',
        link='/billing'
    )

def create_transaction(data):
    # Filter data to only include valid SubscriptionTransaction columns
    valid_cols = [c.key for c in SubscriptionTransaction.__table__.columns]
    filtered_data = {k: v for k, v in data.items() if k in valid_cols}
    
    transaction = SubscriptionTransaction(**filtered_data)
    db.session.add(transaction)
    db.session.commit()
    
    # Auto-upgrade User Plan if Payment Completed
    if data.get('status') == 'COMPLETED':
        _activate_subscription(transaction)

    return transaction

def update_transaction_status(transaction_id, status):
    transaction = SubscriptionTransaction.query.get(transaction_id)
    if not transaction:
        current_app.logger.error(f"Transaction {transaction_id} not found")
        return None
        
    if status == 'COMPLETED' and transaction.status != 'COMPLETED':
        transaction.status = 'COMPLETED'
        _activate_subscription(transaction)
    elif status == 'REJECTED':
        transaction.status = 'REJECTED'
        transaction.is_active = False
        db.session.commit()
    else:
        transaction.status = status
        db.session.commit()
        
    return transaction

def _format_phone_number(phone):
    """Ensure phone number is in 09xxxxxxxx or 07xxxxxxxx format (10 digits)"""
    if not phone:
        return None
    
    # Remove all non-digits
    digits = ''.join(filter(str.isdigit, phone))
    
    # Common Ethiopia formats: +2519..., 2519..., 09..., 9...
    if digits.startswith('251'):
        digits = '0' + digits[3:]
    elif digits.startswith('9') and len(digits) == 9:
        digits = '0' + digits
    elif digits.startswith('7') and len(digits) == 9:
        digits = '0' + digits
        
    if len(digits) == 10 and (digits.startswith('09') or digits.startswith('07')):
        return digits
    
    return None

def initiate_chapa_payment(transaction, user, plan):
    try:
        headers = {
            "Authorization": f"Bearer {current_app.config['CHAPA_SECRET_KEY']}",
            "Content-Type": "application/json",
        }
        
        callback_url = current_app.config['CHAPA_CALLBACK_URL']
        return_url = current_app.config['CHAPA_RETURN_URL']

        first_name = user.first_name or "User"
        last_name = user.last_name or ""

        # Sanitize description: Chapa only allows letters, numbers, hyphens, underscores, spaces, and dots
        clean_description = f"Subscription {plan.name}"
        import re
        clean_description = re.sub(r'[^a-zA-Z0-9\-_ .]', '', clean_description)

        payload = {
            "amount": str(transaction.amount),
            "currency": "ETB",
            "email": "abubekermubarek@gmail.com",
            "first_name": first_name,
            "last_name": last_name,
            "tx_ref": transaction.transaction_reference,
            "callback_url": callback_url,
            "return_url": return_url,
            "customization": {
                "title": "GlobalPath",
                "description": clean_description[:100] # Description usually has longer limit but let's keep it safe
            }
        }
        
        # Phone number is optional but must be 10 digits starting with 09 or 07 if provided
        formatted_phone = _format_phone_number(user.phone_number)
        if formatted_phone:
            payload["phone_number"] = formatted_phone

        resp = requests.post(f"{current_app.config['CHAPA_BASE_URL']}/transaction/initialize", json=payload, headers=headers, timeout=20)
        if resp.status_code >= 400:
            current_app.logger.error(f"Chapa Init Error: {resp.status_code} - {resp.text}")
            return None
        
        data = resp.json()
        if data.get('status') == 'success':
            return data.get('data', {}).get('checkout_url')
            
        return None
                
    except Exception as e:
        current_app.logger.error(f"Chapa Init Exception: {str(e)}")
        return None

def verify_chapa_payment(tx_ref):
    """Verify a transaction with Chapa"""
    try:
        headers = {
            "Authorization": f"Bearer {current_app.config['CHAPA_SECRET_KEY']}"
        }
        
        url = f"{current_app.config['CHAPA_BASE_URL']}/transaction/verify/{tx_ref}"
        resp = requests.get(url, headers=headers, timeout=20)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('status') == 'success' and data.get('data', {}).get('status') == 'success':
                return True, data.get('data')
        
        return False, resp.json() if resp.status_code < 500 else "Server Error"
    except Exception as e:
        return False, str(e)
