from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.support import SupportTicket, TicketReply
from app.models.user import User
from app.models.enums import UserRole, TicketStatus, TicketPriority

bp = Blueprint('support', __name__, url_prefix='/api/support')

@bp.route('/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('subject') or not data.get('description'):
        return jsonify({'message': 'Subject and description are required'}), 400

    ticket = SupportTicket(
        user_id=user_id,
        subject=data['subject'],
        description=data['description'],
        category=data.get('category', 'GENERAL'),
        priority=TicketPriority[data.get('priority', 'MEDIUM')]
    )

    db.session.add(ticket)
    db.session.commit()

    # Trigger Bot Response for quick investigation/acknowledgment
    trigger_bot_response(ticket.id)

    return jsonify(ticket.to_dict()), 201

def trigger_bot_response(ticket_id):
    """Simple bot logic to provide immediate feedback based on category"""
    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return

    # Find or use a system admin identity for the bot
    bot_user = User.query.filter_by(role=UserRole.ADMIN).first()
    if not bot_user:
        return # Fallback if no admin exists yet

    bot_messages = {
        'TECHNICAL': "Sentinel Protocol initialized. I'm scanning our network logs for latency or sync errors related to your account. Please ensure your browser cache is cleared and you are using the latest version of our Gateway.",
        'PAYMENT': "Financial Node detected. I've flagged your transaction ID for escrow verification. If this is regarding a failed refill, please check if your bank has authorized the Chapa/Telebirr gateway request.",
        'SHIPMENT': "Logistics Trace active. I'm cross-referencing your shipment ID with our traveler GPS metadata. Our protocol indicates high verify-density in your region; an agent will confirm the node status shortly.",
        'GENERAL': "Transmission received. Our core specialists have been notified of your inquiry. Our current processing time for priority {} is approximately 2-4 standard hours.".format(ticket.priority.value)
    }

    message = bot_messages.get(ticket.category.upper(), bot_messages['GENERAL'])
    
    bot_reply = TicketReply(
        ticket_id=ticket_id,
        user_id=bot_user.id,
        message=f"[SENTINEL-BOT]: {message}"
    )
    
    ticket.status = TicketStatus.PENDING
    db.session.add(bot_reply)
    
    # Notify user of bot response
    from app.models.notification import create_notification
    create_notification(
        user_id=ticket.user_id,
        title="Sentinel Protocol Initialized",
        message="A sentinel-bot has analyzed your transmission and provided initial diagnostics.",
        type='INFO',
        link='/support'
    )

    db.session.commit()

@bp.route('/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role == UserRole.ADMIN:
        tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    else:
        tickets = SupportTicket.query.filter_by(user_id=user_id).order_by(SupportTicket.created_at.desc()).all()
    
    return jsonify([t.to_dict() for t in tickets]), 200

@bp.route('/tickets/<ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ticket = SupportTicket.query.get(ticket_id)

    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404
    
    if user.role != UserRole.ADMIN and ticket.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403

    result = ticket.to_dict()
    result['replies'] = [r.to_dict() for r in ticket.replies]
    return jsonify(result), 200

@bp.route('/tickets/<ticket_id>/reply', methods=['POST'])
@jwt_required()
def reply_to_ticket(ticket_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ticket = SupportTicket.query.get(ticket_id)

    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404
    
    if user.role != UserRole.ADMIN and ticket.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    if not data or not data.get('message'):
        return jsonify({'message': 'Message is required'}), 400

    reply = TicketReply(
        ticket_id=ticket_id,
        user_id=user_id,
        message=data['message']
    )

    # If admin replies, change status to PENDING or RESOLVED optionally
    if user.role == UserRole.ADMIN:
        ticket.status = TicketStatus.PENDING
    else:
        ticket.status = TicketStatus.OPEN

    db.session.add(reply)
    
    # Notify relevant party
    from app.models.notification import create_notification
    if user.role == UserRole.ADMIN:
        # Notify ticket owner
        create_notification(
            user_id=ticket.user_id,
            title="Support Update",
            message=f"A support specialist has responded to your ticket: {ticket.subject}",
            type='SUCCESS',
            link='/support'
        )
    else:
        # Notify all admins
        admins = User.query.filter_by(role=UserRole.ADMIN).all()
        for admin in admins:
            create_notification(
                user_id=admin.id,
                title="Ticket Activity",
                message=f"User {user.first_name} {user.last_name} replied to ticket: {ticket.subject}",
                type='INFO',
                link='/admin'
            )

    db.session.commit()
    return jsonify(reply.to_dict()), 201

@bp.route('/tickets/<ticket_id>/status', methods=['PUT'])
@jwt_required()
def update_ticket_status(ticket_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403

    data = request.get_json()
    status = data.get('status')
    if not status or status not in [s.value for s in TicketStatus]:
        return jsonify({'message': 'Valid status is required'}), 400

    ticket = SupportTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404

    ticket.status = TicketStatus[status]
    db.session.commit()
    return jsonify(ticket.to_dict()), 200
