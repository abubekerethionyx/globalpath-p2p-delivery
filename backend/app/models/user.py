from app.extensions import db, bcrypt
from app.models.enums import UserRole, VerificationStatus
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.SENDER)
    avatar = db.Column(db.String(255))
    rating = db.Column(db.Float, default=0.0)
    completed_deliveries = db.Column(db.Integer, default=0)
    earnings = db.Column(db.Float, default=0.0)
    wallet_balance = db.Column(db.Float, default=0.0)
    current_plan_id = db.Column(db.String(36), db.ForeignKey('subscription_plans.id'))
    items_count_this_month = db.Column(db.Integer, default=0)
    
    # Security Fields
    verification_status = db.Column(db.Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED)
    id_type = db.Column(db.String(20)) # 'NATIONAL_ID' | 'PASSPORT'
    national_id = db.Column(db.String(50))
    passport_number = db.Column(db.String(50))
    passport_expiry = db.Column(db.DateTime)
    issuance_country = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    home_address = db.Column(db.String(255))
    emergency_contact = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    selfie_url = db.Column(db.String(255))
    id_front_url = db.Column(db.String(255))
    id_back_url = db.Column(db.String(255))
    liveness_video = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    plan = db.relationship('SubscriptionPlan', backref='users')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
