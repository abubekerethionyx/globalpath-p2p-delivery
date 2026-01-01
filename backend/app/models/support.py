from app.extensions import db
from app.models.enums import TicketStatus, TicketPriority
from datetime import datetime
import uuid

class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = db.Column(db.Enum(TicketPriority), default=TicketPriority.MEDIUM)
    category = db.Column(db.String(50), nullable=False, default='GENERAL')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to user
    user = db.relationship('User', backref=db.backref('tickets', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subject': self.subject,
            'description': self.description,
            'status': self.status.value,
            'priority': self.priority.value,
            'category': self.category,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_name': f"{self.user.first_name} {self.user.last_name}" if self.user else "Unknown"
        }

class TicketReply(db.Model):
    __tablename__ = 'ticket_replies'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = db.Column(db.String(36), db.ForeignKey('support_tickets.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    ticket = db.relationship('SupportTicket', backref=db.backref('replies', lazy=True, order_by='TicketReply.created_at'))
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'user_name': f"{self.user.first_name} {self.user.last_name}",
            'user_role': self.user.role.value,
            'message': self.message,
            'created_at': self.created_at.isoformat()
        }
