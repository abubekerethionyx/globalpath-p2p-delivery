from flask import Blueprint, request, jsonify
from app.services import message_service
from app.schemas.message import MessageSchema, MessageThreadSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('messages', __name__, url_prefix='/api/messages')
message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)
thread_schema = MessageThreadSchema()
threads_schema = MessageThreadSchema(many=True)

@bp.route('/threads', methods=['POST'])
@jwt_required()
def create_thread():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    other_user_id = data.get('participant_id')
    shipment_id = data.get('shipment_id')
    
    if not other_user_id:
        return jsonify({"error": "participant_id is required"}), 400
        
    thread = message_service.create_thread(current_user_id, other_user_id, shipment_id)
    return jsonify(thread_schema.dump(thread)), 201

@bp.route('/threads', methods=['GET'])
@jwt_required()
def get_user_threads():
    current_user_id = get_jwt_identity()
    threads = message_service.get_user_threads(current_user_id)
    return jsonify(threads_schema.dump(threads))

@bp.route('/threads/<thread_id>/messages', methods=['GET'])
@jwt_required()
def get_thread_messages(thread_id):
    messages = message_service.get_thread_messages(thread_id)
    return jsonify(messages_schema.dump(messages))

@bp.route('/', methods=['POST'])
@jwt_required()
def create_message():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    data['sender_id'] = current_user_id
    
    if 'thread_id' not in data:
         return jsonify({"error": "thread_id is required"}), 400

    new_message = message_service.create_message(data)
    return jsonify(message_schema.dump(new_message)), 201
