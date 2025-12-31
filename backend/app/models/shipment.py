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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_shipments')
    partner = db.relationship('User', foreign_keys=[partner_id], backref='partnered_shipments')
