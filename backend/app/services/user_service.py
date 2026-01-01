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
    db.session.commit()
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
