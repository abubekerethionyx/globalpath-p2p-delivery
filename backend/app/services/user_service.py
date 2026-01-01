from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from datetime import datetime, timedelta
from app.models.user import User
from app.extensions import db
from flask_jwt_extended import create_access_token

def get_all_users():
    return User.query.all()

def get_user(user_id):
    return User.query.get(user_id)

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def create_user(data):
    if get_user_by_email(data.get('email')):
        return None # User already exists
    
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        phone_number=data.get('phone_number'),
        is_phone_verified=data.get('is_phone_verified', False),
        role=data.get('role', 'SENDER')
    )
    if 'password' in data:
        user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit() # Commit first to get user.id

    # Auto-subscribe to "6 Month Free Starter" plan based on Role
    promo_plan_id = 's-free-promo-6mo'
    if user.role == 'PICKER' or (hasattr(user.role, 'value') and user.role.value == 'PICKER'):
        promo_plan_id = 'p-free-promo-6mo'
    
    promo_plan = SubscriptionPlan.query.get(promo_plan_id)
    
    # Fallback lookup if ID not found (e.g. if seed not run yet or IDs changed)
    if not promo_plan:
        target_name = "6 Month Free Traveler" if 'p-free' in promo_plan_id else "6 Month Free Starter"
        promo_plan = SubscriptionPlan.query.filter_by(name=target_name).first()
    
    if promo_plan:
        sub = SubscriptionTransaction(
            user_id=user.id,
            plan_id=promo_plan.id,
            plan_name=promo_plan.name,
            amount=0.0,
            payment_method='system_promo',
            status='COMPLETED',
            is_active=True,
            remaining_usage=promo_plan.limit,
            end_date=datetime.utcnow() + timedelta(days=180) # 6 months
        )
        user.current_plan_id = promo_plan.id
        db.session.add(sub)
        db.session.commit()

        # Notify User of Free Plan
        from app.models.notification import create_notification
        action_type = "pickups" if 'p-free' in promo_plan_id else "shipments"
        
        create_notification(
            user_id=user.id,
            title="Welcome Gift Unlocked!",
            message=f"Welcome to GlobalPath! You have been automatically upgraded to the '{promo_plan.name}'. Enjoy {promo_plan.limit} free {action_type}/month for 6 months.",
            type='SUCCESS',
            link='/packaging'
        )

    return user

def authenticate_user(email, password):
    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return {"token": access_token, "user": user}
    return None

def update_user(user_id, data):
    user = User.query.get(user_id)
    if user:
        for key, value in data.items():
            if key == 'password':
                user.set_password(value)
            else:
                setattr(user, key, value)
        db.session.commit()
    return user

def delete_user(user_id):
    user = User.query.get(user_id)
    if user:
        db.session.delete(user)
        db.session.commit()
    return user
