from app.extensions import db
from datetime import datetime
import uuid

class MessageThread(db.Model):
    __tablename__ = 'message_threads'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shipment_id = db.Column(db.String(36), db.ForeignKey('shipment_items.id'), nullable=True) # Optional context
    participant1_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    participant2_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    participant1 = db.relationship('User', foreign_keys=[participant1_id], backref='threads_as_p1')
    participant2 = db.relationship('User', foreign_keys=[participant2_id], backref='threads_as_p2')
    shipment = db.relationship('ShipmentItem', backref='threads')
    messages = db.relationship('Message', backref='thread', lazy=True, cascade="all, delete-orphan")

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shipment_id = db.Column(db.String(36), db.ForeignKey('shipment_items.id'), nullable=True) # Kept for legacy/context
    thread_id = db.Column(db.String(36), db.ForeignKey('message_threads.id'), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

    # Relationships
    shipment = db.relationship('ShipmentItem', backref='messages')
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')
