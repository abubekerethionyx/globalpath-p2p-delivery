from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.travel import Travel, TravelPin
from app.models.shipment import ShipmentItem
from app.models.user import User
from datetime import datetime

bp = Blueprint('travels', __name__, url_prefix='/api/travels')

@bp.route('/', methods=['GET'])
def get_travels():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = Travel.query.order_by(Travel.created_at.desc()).paginate(page=page, per_page=per_page)
    
    travels = []
    for t in pagination.items:
        travels.append({
            'id': t.id,
            'user': {
                'id': t.user.id,
                'first_name': t.user.first_name,
                'last_name': t.user.last_name,
                'avatar': t.user.avatar,
                'verification_status': t.user.verification_status.value if hasattr(t.user.verification_status, 'value') else t.user.verification_status
            },
            'origin_country': t.origin_country,
            'destination_country': t.destination_country,
            'travel_date': t.travel_date.isoformat(),
            'weight_capacity': t.weight_capacity,
            'description': t.description,
            'status': t.status,
            'created_at': t.created_at.isoformat(),
            'pins_count': len(t.pins)
        })
    
    return jsonify({
        'travels': travels,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

@bp.route('/<travel_id>', methods=['GET'])
def get_travel(travel_id):
    t = Travel.query.get_or_404(travel_id)
    return jsonify({
        'id': t.id,
        'user': {
            'id': t.user.id,
            'first_name': t.user.first_name,
            'last_name': t.user.last_name,
            'avatar': t.user.avatar,
            'verification_status': t.user.verification_status.value if hasattr(t.user.verification_status, 'value') else t.user.verification_status,
            'is_subscription_active': t.user.is_subscription_active
        },
        'origin_country': t.origin_country,
        'destination_country': t.destination_country,
        'travel_date': t.travel_date.isoformat(),
        'weight_capacity': t.weight_capacity,
        'description': t.description,
        'status': t.status,
        'created_at': t.created_at.isoformat(),
        'pins_count': len(t.pins)
    }), 200

@bp.route('/', methods=['POST'])
@jwt_required()
def create_travel():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    origin = data.get('origin_country')
    dest = data.get('destination_country')
    date_str = data.get('travel_date')
    
    if not all([origin, dest, date_str]):
        return jsonify({'message': 'Origin, destination and travel date are required'}), 400
        
    try:
        travel_date = datetime.fromisoformat(date_str.replace('Z', ''))
    except ValueError:
        return jsonify({'message': 'Invalid date format'}), 400
        
    travel = Travel(
        user_id=current_user_id,
        origin_country=origin,
        destination_country=dest,
        travel_date=travel_date,
        weight_capacity=data.get('weight_capacity'),
        description=data.get('description')
    )
    
    db.session.add(travel)
    db.session.commit()
    
    # Check for reward
    from app.models.setting import GlobalSetting
    from app.services.user_service import reward_user_coins
    
    reward_amount = GlobalSetting.get_value('reward_travel_post_amount')
    if reward_amount and int(reward_amount) > 0:
        reward_user_coins(current_user_id, int(reward_amount), "Travel Announcement Reward")
    
    return jsonify({'message': 'Travel announced successfully', 'id': travel.id}), 201

@bp.route('/<travel_id>', methods=['DELETE'])
@jwt_required()
def delete_travel(travel_id):
    current_user_id = get_jwt_identity()
    travel = Travel.query.get_or_404(travel_id)
    
    if travel.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    db.session.delete(travel)
    db.session.commit()
    
    return jsonify({'message': 'Travel deleted successfully'}), 200

@bp.route('/<travel_id>/status', methods=['PUT'])
@jwt_required()
def update_travel_status(travel_id):
    current_user_id = get_jwt_identity()
    from app.models.user import User
    current_user = User.query.get(current_user_id)
    
    travel = Travel.query.get_or_404(travel_id)
    
    # Only travel owner or admin can update status
    if travel.user_id != current_user_id and current_user.role.value != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['ACTIVE', 'COMPLETED', 'CANCELLED']:
        return jsonify({'message': 'Invalid status'}), 400
    
    travel.status = new_status
    db.session.commit()
    
    return jsonify({'message': f'Travel status updated to {new_status}'}), 200

@bp.route('/<travel_id>/pin', methods=['POST'])
@jwt_required()
def pin_item(travel_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    shipment_id = data.get('shipment_id')
    
    if not shipment_id:
        return jsonify({'message': 'Shipment ID is required'}), 400
        
    travel = Travel.query.get_or_404(travel_id)
    shipment = ShipmentItem.query.get_or_404(shipment_id)
    
    if shipment.sender_id != current_user_id:
        return jsonify({'message': 'You can only pin your own items'}), 403
        
    # Check if already pinned
    existing = TravelPin.query.filter_by(travel_id=travel_id, shipment_id=shipment_id).first()
    if existing:
        return jsonify({'message': 'Item already pinned to this travel'}), 400
        
    pin = TravelPin(
        travel_id=travel_id,
        shipment_id=shipment_id
    )
    
    db.session.add(pin)
    
    # Create a notification for the traveler
    from app.models.notification import create_notification
    create_notification(
        user_id=travel.user_id,
        title="New Item Pinned",
        message=f"{shipment.sender.first_name} pinned an item to your travel from {travel.origin_country} to {travel.destination_country}.",
        type='INFO',
        link=f'/feed'
    )
    
    db.session.commit()
    
    return jsonify({'message': 'Item pinned successfully'}), 201

@bp.route('/<travel_id>/pins', methods=['GET'])
def get_pins(travel_id):
    travel = Travel.query.get_or_404(travel_id)
    pins = []
    for p in travel.pins:
        pins.append({
            'id': p.id,
            'shipment': {
                'id': p.shipment.id,
                'category': p.shipment.category,
                'description': p.shipment.description,
                'weight': p.shipment.weight,
                'fee': p.shipment.fee,
                'image_urls': p.shipment.image_urls,
                'sender': {
                    'id': p.shipment.sender.id,
                    'first_name': p.shipment.sender.first_name,
                    'last_name': p.shipment.sender.last_name
                }
            },
            'status': p.status,
            'created_at': p.created_at.isoformat()
        })
    return jsonify(pins), 200

@bp.route('/my-travels', methods=['GET'])
@jwt_required()
def get_my_travels():
    current_user_id = get_jwt_identity()
    travels = Travel.query.filter_by(user_id=current_user_id).order_by(Travel.created_at.desc()).all()
    
    result = []
    for t in travels:
        result.append({
            'id': t.id,
            'origin_country': t.origin_country,
            'destination_country': t.destination_country,
            'travel_date': t.travel_date.isoformat(),
            'weight_capacity': t.weight_capacity,
            'description': t.description,
            'status': t.status,
            'created_at': t.created_at.isoformat(),
            'pins_count': len(t.pins)
        })
    
    return jsonify(result), 200

@bp.route('/pins/<pin_id>/status', methods=['PUT'])
@jwt_required()
def update_pin_status(pin_id):
    current_user_id = get_jwt_identity()
    pin = TravelPin.query.get_or_404(pin_id)
    
    if pin.travel.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    new_status = data.get('status') # APPROVED, REJECTED
    
    if new_status not in ['APPROVED', 'REJECTED', 'PENDING']:
        return jsonify({'message': 'Invalid status'}), 400
        
    pin.status = new_status
    db.session.commit()
    
    # Notify the sender
    from app.models.notification import create_notification
    create_notification(
        user_id=pin.shipment.sender_id,
        title=f"Travel Pin {new_status.capitalize()}",
        message=f"The traveler has {new_status.lower()} your pinned item for the trip to {pin.travel.destination_country}.",
        type='SUCCESS' if new_status == 'APPROVED' else 'ERROR',
        link='/dashboard'
    )
    
    return jsonify({'message': f'Pin status updated to {new_status}'}), 200

@bp.route('/pins/<pin_id>', methods=['DELETE'])
@jwt_required()
def unpin_item(pin_id):
    current_user_id = get_jwt_identity()
    pin = TravelPin.query.get_or_404(pin_id)
    
    # Either the sender of the shipment or the traveler can remove the pin
    if pin.shipment.sender_id != current_user_id and pin.travel.user_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    db.session.delete(pin)
    db.session.commit()
    
    return jsonify({'message': 'Item unpinned successfully'}), 200
