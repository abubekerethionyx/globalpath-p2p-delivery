from flask import Blueprint, request, jsonify
from app.models.setting import GlobalSetting
from app.models.user import User, UserRole
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.notification import Notification, create_notification
from app.models.shipment import ShipmentItem
from app.models.supported_country import SupportedCountry

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    settings = GlobalSetting.query.all()
    return jsonify({s.key: {'value': s.value, 'description': s.description} for s in settings})

@bp.route('/settings', methods=['POST'])
@jwt_required()
def update_settings():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400
        
    for key, info in data.items():
        value = info.get('value')
        description = info.get('description')
        GlobalSetting.set_value(key, value, description)
        
    return jsonify({'message': 'Settings updated successfully'})

@bp.route('/settings/public', methods=['GET'])
def get_public_settings():
    # Only expose specific settings that frontend needs to know
    keys = [
        'require_subscription_for_details', 
        'require_subscription_for_chat',
        'require_otp_for_signup',
        'enable_free_promo_sender',
        'enable_free_promo_picker',
        'enable_google_login',
        'maintenance_interval_hours'
    ]
    settings = {}
    for key in keys:
        val = GlobalSetting.get_value(key)
        if val is not None:
            settings[key] = val
        else:
            # Defaults
            if key in ['require_otp_for_signup', 'enable_free_promo_sender', 'enable_free_promo_picker', 'enable_google_login']:
                settings[key] = True
            elif key == 'maintenance_interval_hours':
                settings[key] = '24'
            else:
                settings[key] = False
            
    return jsonify(settings)
@bp.route('/notifications/broadcast', methods=['POST'])
@jwt_required()
def broadcast_notification():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    data = request.get_json()
    title = data.get('title')
    message = data.get('message')
    ntype = data.get('type', 'INFO')
    target_type = data.get('target_type') # ALL, ROLE, USERS, LOCATION_HISTORY
    
    if not title or not message:
        return jsonify({'message': 'Title and message are required'}), 400
        
    targets = []
    
    if target_type == 'ALL':
        targets = User.query.all()
    elif target_type == 'ROLE':
        roles = data.get('roles', [])
        targets = User.query.filter(User.role.in_(roles)).all()
    elif target_type == 'USERS':
        user_ids = data.get('user_ids', [])
        targets = User.query.filter(User.id.in_(user_ids)).all()
    elif target_type == 'LOCATION_HISTORY':
        location = data.get('location')
        if location:
            # Find users who have picked up or delivered to this location
            pickers = db.session.query(User).join(ShipmentItem, User.id == ShipmentItem.partner_id)\
                .filter((ShipmentItem.pickup_country == location) | (ShipmentItem.dest_country == location)).all()
            targets = list(set(pickers)) # Unique users
    
    for user in targets:
        create_notification(user.id, title, message, ntype)
    
    return jsonify({'message': f'Notification broadcasted to {len(targets)} users successfully'})

@bp.route('/users', methods=['GET'])
@jwt_required()
def get_users_list():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'role': u.role.value
    } for u in users])

@bp.route('/countries', methods=['GET'])
@jwt_required()
def get_countries():
    # Admin gets all, even inactive ones if we wanted, but let's keep it simple
    countries = SupportedCountry.query.all()
    return jsonify([c.to_dict() for c in countries])

@bp.route('/countries', methods=['POST'])
@jwt_required()
def add_country():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'message': 'Country name is required'}), 400
        
    if SupportedCountry.query.filter_by(name=name).first():
        return jsonify({'message': 'Country already exists'}), 400
        
    country = SupportedCountry(name=name)
    db.session.add(country)
    db.session.commit()
    return jsonify(country.to_dict()), 201

@bp.route('/countries/<country_id>', methods=['DELETE'])
@jwt_required()
def delete_country(country_id):
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    country = SupportedCountry.query.get(country_id)
    if not country:
        return jsonify({'message': 'Country not found'}), 404
        
    db.session.delete(country)
    db.session.commit()
    return jsonify({'message': 'Country deleted successfully'})

@bp.route('/countries/<country_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_country(country_id):
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    country = SupportedCountry.query.get(country_id)
    if not country:
        return jsonify({'message': 'Country not found'}), 404
        
    country.is_active = not country.is_active
    db.session.commit()
    return jsonify(country.to_dict())

@bp.route('/maintenance/run', methods=['POST'])
@jwt_required()
def trigger_maintenance():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
    
    from app.services.maintenance_service import run_system_maintenance
    run_system_maintenance()
    
    return jsonify({'message': 'System maintenance protocol executed successfully'})
