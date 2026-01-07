from app.extensions import db
from datetime import datetime
import uuid

class Travel(db.Model):
    __tablename__ = 'travels'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    origin_country = db.Column(db.String(100), nullable=False)
    destination_country = db.Column(db.String(100), nullable=False)
    travel_date = db.Column(db.DateTime, nullable=False)
    weight_capacity = db.Column(db.Float) # in kg
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='ACTIVE') # ACTIVE, COMPLETED, CANCELLED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref='travels')
    pins = db.relationship('TravelPin', backref='travel', lazy=True, cascade='all, delete-orphan')

class TravelPin(db.Model):
    __tablename__ = 'travel_pins'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    travel_id = db.Column(db.String(36), db.ForeignKey('travels.id'), nullable=False)
    shipment_id = db.Column(db.String(36), db.ForeignKey('shipment_items.id'), nullable=False)
    status = db.Column(db.String(20), default='PENDING') # PENDING, APPROVED, REJECTED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    shipment = db.relationship('ShipmentItem', backref='travel_pins')
