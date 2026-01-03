from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from datetime import datetime, timedelta
from app.models.user import User
from app.extensions import db
from flask_jwt_extended import create_access_token
from flask import current_app

def assign_default_subscription(user):
    """Assigns the default 6-month free promotion plan to a new user."""
    from app.models.setting import GlobalSetting
    from app.constants import (
        SETTING_ENABLE_FREE_PROMO_SENDER, SETTING_ENABLE_FREE_PROMO_PICKER,
        SETTING_FREE_PROMO_SENDER_PLAN_ID, SETTING_FREE_PROMO_PICKER_PLAN_ID,
        DEFAULT_SENDER_PLAN_ID, DEFAULT_PICKER_PLAN_ID
    )
    
    # Robust role check
    is_picker = False
    if hasattr(user.role, 'name'):
        is_picker = user.role.name == 'PICKER'
    elif isinstance(user.role, str):
        is_picker = user.role.upper() == 'PICKER'
    
    # Check if promo is enabled for this specific role
    promo_enabled_key = SETTING_ENABLE_FREE_PROMO_PICKER if is_picker else SETTING_ENABLE_FREE_PROMO_SENDER
    if not GlobalSetting.get_value(promo_enabled_key, default=True):
        print(f"Promo disabled for {'Picker' if is_picker else 'Sender'} via settings.")
        return False
    
    # Try to get plan ID from settings first
    setting_key = SETTING_FREE_PROMO_PICKER_PLAN_ID if is_picker else SETTING_FREE_PROMO_SENDER_PLAN_ID
    promo_plan_id = GlobalSetting.get_value(setting_key)
    
    # If no specific ID found in settings, return without subscription (per user request)
    if not promo_plan_id:
        print(f"No promo plan ID configured for {'Picker' if is_picker else 'Sender'}. Skipping auto-subscription.")
        return False
    
    promo_plan = SubscriptionPlan.query.get(promo_plan_id)
    
    if not promo_plan:
        print(f"Plan with ID {promo_plan_id} not found in database. Skipping auto-subscription.")
        return False

    
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
        
        # Calculate days until end date for the message
        days_total = promo_plan.duration_days or 180
        
        create_notification(
            user_id=user.id,
            title="Welcome Gift Unlocked!",
            message=f"Welcome to GlobalPath! You have been automatically upgraded to the '{promo_plan.name}'. Enjoy {promo_plan.limit} free {action_type}/month for the next {days_total} days.",
            type='SUCCESS',
            link='/packaging'
        )
        print(f"Successfully assigned '{promo_plan.name}' to {user.email}")
        return True
    
    print(f"Failing to assign default subscription: No valid plan found for {'Picker' if is_picker else 'Sender'}.")
    return False

def get_all_users(page=1, per_page=10, role=None, status=None, search=None):
    from app.models.enums import UserRole, VerificationStatus
    
    query = User.query
    
    if role and role != 'ALL':
        try:
            query = query.filter_by(role=UserRole(role))
        except ValueError:
            pass
            
    if status and status != 'ALL':
        try:
            query = query.filter_by(verification_status=VerificationStatus(status))
        except ValueError:
            pass
            
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter)) |
            (User.email.ilike(search_filter))
        )
    
    # Order by newest first
    query = query.order_by(User.created_at.desc())
    
    return query.paginate(page=page, per_page=per_page, error_out=False)

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
    
    from app.models.setting import GlobalSetting
    require_otp = GlobalSetting.get_value('require_otp_for_signup', default=True)
    from app.models.enums import VerificationStatus

    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        phone_number=data.get('phone_number'),
        is_phone_verified=data.get('is_phone_verified', False),
        role=data.get('role', 'SENDER'),
        email_verification_token=secrets.token_urlsafe(32),
        email_otp=otp if require_otp else None,
        email_otp_expiry=(datetime.utcnow() + timedelta(minutes=10)) if require_otp else None,
        is_email_verified=not require_otp,
        verification_status=VerificationStatus.VERIFIED if not require_otp else VerificationStatus.UNVERIFIED
    )
    if 'password' in data:
        user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit() # Commit first to get user.id

    # Auto-subscribe to default promo plan
    assign_default_subscription(user)

    # Award Registration Bonus
    from app.constants import SETTING_REGISTRATION_BONUS
    reg_bonus = int(GlobalSetting.get_value(SETTING_REGISTRATION_BONUS, default=10))
    reward_user_coins(user.id, reg_bonus, "New Account Protocol Initialization")

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
        # Date fields that need careful handling
        date_fields = ['passport_expiry', 'date_of_birth']
        for key, value in data.items():
            if key == 'password':
                user.set_password(value)
            elif key in date_fields:
                if value and isinstance(value, str) and value.strip():
                    try:
                        # Attempt to parse common formats
                        if 'T' in value:
                            setattr(user, key, datetime.fromisoformat(value.replace('Z', '+00:00')))
                        else:
                            setattr(user, key, datetime.strptime(value, '%Y-%m-%d'))
                    except (ValueError, TypeError):
                        setattr(user, key, None)
                elif not value:
                    setattr(user, key, None)
                else:
                    setattr(user, key, value)
            else:
                setattr(user, key, value)
        db.session.commit()
    return user

def reward_user_coins(user_id, amount, reason="Activity Reward"):
    """Awards technical credits (coins) to a user for specific achievements."""
    user = User.query.get(user_id)
    if not user or amount <= 0:
        return False
        
    user.coins_balance += int(amount)
    db.session.commit()
    
    # Notify User
    from app.models.notification import create_notification
    create_notification(
        user_id=user_id,
        title="Protocol Credits Received",
        message=f"You have been awarded {amount} technical credits for: {reason}. Use them to unlock premium tiers.",
        type='SUCCESS',
        link='/packaging'
    )
    print(f"Awarded {amount} coins to user {user_id} for {reason}")
    return True

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

            # Award Registration Bonus for new Google User
            from app.models.setting import GlobalSetting
            from app.constants import SETTING_REGISTRATION_BONUS
            reg_bonus = int(GlobalSetting.get_value(SETTING_REGISTRATION_BONUS, default=10))
            reward_user_coins(user.id, reg_bonus, "Google Protocol Authentication Bonus")
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
