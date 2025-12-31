from app.extensions import db
from app.models.enums import UserRole
from datetime import datetime
import uuid

class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    limit = db.Column(db.Integer, nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    description = db.Column(db.Text)

class SubscriptionTransaction(db.Model):
    __tablename__ = 'subscription_transactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.String(36), db.ForeignKey('subscription_plans.id'), nullable=False)
    plan_name = db.Column(db.String(100))
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20)) # 'wallet' | 'direct'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='PENDING') # 'COMPLETED' | 'PENDING'
    remaining_usage = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=False)
    end_date = db.Column(db.DateTime)
    
    # Payment Details
    transaction_reference = db.Column(db.String(100)) # Telebirr ID or Bank Ref
    receipt_url = db.Column(db.String(255)) # Path to uploaded receipt image

    # Relationships
    user = db.relationship('User', backref=db.backref('subscription_transactions', lazy=True))
    plan = db.relationship('SubscriptionPlan')
