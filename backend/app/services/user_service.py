from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from datetime import datetime, timedelta
from app.models.user import User
from app.extensions import db
from flask_jwt_extended import create_access_token
from flask import current_app

def assign_default_subscription(user):
    """Assigns the default 6-month free promotion plan to a new user."""
    # Determine the correct promo plan ID from config
    if not current_app.config['IS_FREE_PROMO_ENABLED_FOR_SENDER'] and user.role.value == 'SENDER':
        return False
    
    if not current_app.config['IS_FREE_PROMO_ENABLED_FOR_PICKER'] and user.role.value == 'PICKER':
        return False
    
    is_picker = user.role == 'PICKER' or (hasattr(user.role, 'value') and user.role.value == 'PICKER')
    promo_plan_id = current_app.config['DEFAULT_PICKER_PLAN_ID'] if is_picker else current_app.config['DEFAULT_SENDER_PLAN_ID']
    
    promo_plan = SubscriptionPlan.query.get(promo_plan_id)
    
    # Fallback lookup if ID not found (e.g. if seed not run yet or IDs changed)
    if not promo_plan:
        target_name = "6 Month Free Traveler" if is_picker else "6 Month Free Starter"
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
        action_type = "pickups" if is_picker else "shipments"
        
        create_notification(
            user_id=user.id,
            title="Welcome Gift Unlocked!",
            message=f"Welcome to GlobalPath! You have been automatically upgraded to the '{promo_plan.name}'. Enjoy {promo_plan.limit} free {action_type}/month for 6 months.",
            type='SUCCESS',
            link='/packaging'
        )
        return True
    return False

def get_all_users():
    return User.query.all()

def get_user(user_id):
    return User.query.get(user_id)

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def create_user(data):
    if get_user_by_email(data.get('email')):
        return None # User already exists
    
    import secrets
    import string
    from datetime import datetime, timedelta
    
    # Generate 6-digit OTP
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        phone_number=data.get('phone_number'),
        is_phone_verified=data.get('is_phone_verified', False),
        role=data.get('role', 'SENDER'),
        email_verification_token=secrets.token_urlsafe(32),
        email_otp=otp,
        email_otp_expiry=datetime.utcnow() + timedelta(minutes=10)
    )
    if 'password' in data:
        user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit() # Commit first to get user.id

    # Auto-subscribe to default promo plan
    assign_default_subscription(user)

    return user

    return user

def authenticate_user(email, password):
    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        if not user.is_email_verified:
           pass
            # return {"unverified": True, "message": "Email not verified. Please check your inbox."}
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

def initiate_password_reset(email):
    import secrets
    from datetime import datetime, timedelta
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return False
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()
    
    # Send Actual Email
    from app.services.email_service import send_password_reset_email
    send_password_reset_email(email, token)
    
    return True

def complete_password_reset(token, new_password):
    from datetime import datetime
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        return False
        
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    return True

def verify_email_otp(email, otp):
    from datetime import datetime
    from app.models.enums import VerificationStatus
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.email_otp or not user.email_otp_expiry:
        return False, "User or OTP not found"
        
    if user.email_otp_expiry < datetime.utcnow():
        return False, "OTP has expired"
        
    if user.email_otp != otp:
        return False, "Invalid OTP code"
        
    user.is_email_verified = True
    user.email_otp = None
    user.email_otp_expiry = None
    user.verification_status = VerificationStatus.VERIFIED
    db.session.commit()
    
    return True, "Email verified successfully"

def google_login(token, role=None):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    from flask import current_app
    from app.models.enums import UserRole, VerificationStatus

    try:
        # Verify Google Token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), current_app.config['GOOGLE_CLIENT_ID'])

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        google_id = idinfo['sub']
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        avatar = idinfo.get('picture', '')

        user = User.query.filter_by(email=email).first()

        if not user:
            # If it's a new user but no role was provided, tell the frontend to ask for a role
            if not role:
                return {"needs_role": True, "email": email}
                
            # Create new user with provided role
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                google_id=google_id,
                avatar=avatar,
                is_email_verified=True,
                role=role,
                verification_status=VerificationStatus.VERIFIED
            )
            db.session.add(user)
            db.session.commit()
            
            # Auto-subscribe new Google user to default promo plan
            assign_default_subscription(user)
        elif not user.google_id:
            # Link Google ID to existing account
            user.google_id = google_id
            if not user.avatar:
                user.avatar = avatar
            user.is_email_verified = True
            db.session.commit()

        access_token = create_access_token(identity=user.id)
        return {"token": access_token, "user": user}

    except Exception as e:
        print(f"Google login failed: {str(e)}")
        return None
