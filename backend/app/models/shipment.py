from app.extensions import db
from app.models.enums import ItemStatus
from datetime import datetime
import uuid

class ShipmentItem(db.Model):
    __tablename__ = 'shipment_items'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    partner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    pickup_country = db.Column(db.String(100), nullable=False)
    dest_country = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    receiver_name = db.Column(db.String(100), nullable=False)
    receiver_phone = db.Column(db.String(20), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    fee = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.Enum(ItemStatus), default=ItemStatus.POSTED)
    image_urls = db.Column(db.JSON) # List of image URLs
    picked_at = db.Column(db.DateTime)
    available_pickup_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ranking_score = db.Column(db.Float, default=0.0)

    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_shipments')
    partner = db.relationship('User', foreign_keys=[partner_id], backref='partnered_shipments')
    requests = db.relationship('ShipmentRequest', backref='shipment', lazy=True, cascade='all, delete-orphan')

class ShipmentRequest(db.Model):
    __tablename__ = 'shipment_requests'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shipment_id = db.Column(db.String(36), db.ForeignKey('shipment_items.id'), nullable=False)
    picker_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='PENDING') # PENDING, APPROVED, REJECTED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    picker = db.relationship('User', backref='shipment_requests')
