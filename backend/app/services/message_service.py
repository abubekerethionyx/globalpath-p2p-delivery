from app.models.message import Message, MessageThread
from app.extensions import db
from sqlalchemy import or_, and_

def get_user_threads(user_id):
    """Get all message threads for a user"""
    return MessageThread.query.filter(
        or_(MessageThread.participant1_id == user_id, MessageThread.participant2_id == user_id)
    ).order_by(MessageThread.updated_at.desc()).all()

def get_thread_messages(thread_id):
    """Get all messages in a thread"""
    return Message.query.filter_by(thread_id=thread_id).order_by(Message.timestamp).all()

def find_thread(user_id1, user_id2, shipment_id=None):
    """Find existing thread between two users, optionally for a specific shipment"""
    query = MessageThread.query.filter(
        or_(
            and_(MessageThread.participant1_id == user_id1, MessageThread.participant2_id == user_id2),
            and_(MessageThread.participant1_id == user_id2, MessageThread.participant2_id == user_id1)
        )
    )
    
    if shipment_id:
        query = query.filter_by(shipment_id=shipment_id)
        
    return query.first()

def create_thread(participant1_id, participant2_id, shipment_id=None):
    """Create a new message thread"""
    # Check if exists first
    existing = find_thread(participant1_id, participant2_id, shipment_id)
    if existing:
        return existing
        
    thread = MessageThread(
        participant1_id=participant1_id,
        participant2_id=participant2_id,
        shipment_id=shipment_id
    )
    db.session.add(thread)
    db.session.commit()
    return thread

def create_message(data):
    """Create a new message in a thread"""
    sender_id = data.get('sender_id')
    thread_id = data.get('thread_id')
    text = data.get('text')
    
    thread = MessageThread.query.get(thread_id)
    if not thread:
        raise ValueError("Thread not found")
        
    # Determine receiver
    receiver_id = thread.participant2_id if thread.participant1_id == sender_id else thread.participant1_id
    
    message = Message(
        thread_id=thread_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        text=text,
        shipment_id=thread.shipment_id
    )
    
    # Update thread timestamp
    thread.updated_at = message.timestamp
    
    db.session.add(message)
    db.session.commit()
    return message
