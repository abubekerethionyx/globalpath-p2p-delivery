from flask import Blueprint, request, jsonify
from app.models.setting import GlobalSetting
from app.models.user import User
from app.models.enums import UserRole, ItemStatus
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
        'chat_request_status_required',
        'require_otp_for_signup',
        'enable_free_promo_sender',
        'enable_free_promo_picker',
        'enable_google_login',
        'maintenance_interval_hours'
    ]
    boolean_keys = [
        'require_subscription_for_details', 
        'require_subscription_for_chat',
        'require_otp_for_signup',
        'enable_free_promo_sender',
        'enable_free_promo_picker',
        'enable_google_login'
    ]
    
    settings = {}
    for key in keys:
        val = GlobalSetting.get_value(key)
        
        if val is not None:
            # Type conversion for boolean keys
            if key in boolean_keys:
                if isinstance(val, str):
                    settings[key] = val.lower() == 'true'
                else:
                    settings[key] = bool(val)
            else:
                settings[key] = val
        else:
            # Defaults
            if key in ['require_otp_for_signup', 'enable_free_promo_sender', 'enable_free_promo_picker', 'enable_google_login']:
                settings[key] = True
            elif key == 'maintenance_interval_hours':
                settings[key] = '24'
            elif key == 'chat_request_status_required':
                settings[key] = 'REQUESTED'
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

@bp.route('/rewards/all', methods=['POST'])
@jwt_required()
def award_all_users():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
        
    data = request.get_json()
    try:
        amount = int(data.get('amount', 0))
    except (TypeError, ValueError):
        return jsonify({'message': 'Invalid amount'}), 400
        
    if amount <= 0:
        return jsonify({'message': 'Amount must be greater than 0'}), 400
        
    reason = data.get('reason', 'Global Protocol Bonus')
    
    from app.services.user_service import reward_user_coins
    users = User.query.all()
    count = 0
    for user in users:
        if reward_user_coins(user.id, amount, reason):
            count += 1
        
    return jsonify({'message': f'Broadcasted {amount} λ to {count} users successfully'})

@bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Admin access required'}), 403
    
    from sqlalchemy import func, and_
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    yesterday = now - timedelta(days=1)
    
    # --- 1. User Sector ---
    total_users = User.query.count()
    users_last_week = User.query.filter(User.created_at >= seven_days_ago).count()
    growth_rate = (users_last_week / (total_users - users_last_week)) * 100 if (total_users - users_last_week) > 0 else 0
    
    senders = User.query.filter_by(role=UserRole.SENDER).count()
    pickers = User.query.filter_by(role=UserRole.PICKER).count()
    admins = User.query.filter_by(role=UserRole.ADMIN).count()
    
    # Active Users (Action in last 24h - Approximation based on recent items/logins if tracked, 
    # but here we'll use recent shipments/travels/subscriptions as proxy)
    # Using a simple proxy: 'verified' users as 'active' for now, or just users who created something recently
    active_users = db.session.query(User).filter(User.created_at >= yesterday).count() # New users are certainly active
    
    # --- 2. Financial Sector ---
    from app.models.subscription import SubscriptionTransaction
    
    # Subscription Revenue (Sum of COMPLETED transactions)
    sub_revenue = db.session.query(func.sum(SubscriptionTransaction.amount)).filter_by(status='COMPLETED').scalar() or 0.0
    
    # Logistics Revenue (Sum of fees of all POSTED/DELIVERED items)
    # Assuming platform takes 100% of 'fee' or 'fee' is the platform cut. Let's assume 'fee' is total volume.
    logistics_volume = db.session.query(func.sum(ShipmentItem.fee)).filter(ShipmentItem.status != 'CANCELLED').scalar() or 0.0
    
    total_revenue = sub_revenue + logistics_volume
    arpu = total_revenue / total_users if total_users > 0 else 0
    
    # --- 3. Logistics Sector ---
    total_shipments = ShipmentItem.query.count()
    delivered_count = ShipmentItem.query.filter_by(status='DELIVERED').count()
    conversion_rate = (delivered_count / total_shipments * 100) if total_shipments > 0 else 0
    
    # Status Breakdown
    shipment_stats = db.session.query(
        ShipmentItem.status, func.count(ShipmentItem.id)
    ).group_by(ShipmentItem.status).all()
    shipments_by_status = {status.value: count for status, count in shipment_stats}
    
    # Volume Last 7 Days (for chart)
    # Group by day
    date_series = []
    for i in range(7):
        date_series.append((now - timedelta(days=i)).date())
    
    volume_trend = []
    revenue_trend = []
    status_trend = []
    
    for d in reversed(date_series):
        # Shipments per day (Total)
        cnt = ShipmentItem.query.filter(func.date(ShipmentItem.created_at) == d).count()
        
        # Shipments per day (by Status)
        day_status_data = {"name": d.strftime("%m-%d"), "Total": cnt}
        # Initialize common statuses
        for s in [ItemStatus.POSTED, ItemStatus.PICKED, ItemStatus.DELIVERED]:
            day_status_data[s.value] = 0
            
        stats = db.session.query(
            ShipmentItem.status, func.count(ShipmentItem.id)
        ).filter(func.date(ShipmentItem.created_at) == d).group_by(ShipmentItem.status).all()
        
        for status, total in stats:
            if status:
                day_status_data[status.value] = total
        
        status_trend.append(day_status_data)
        
        # Revenue per day
        # Subscriptions
        sub_rev_day = db.session.query(func.sum(SubscriptionTransaction.amount)).filter(
            and_(SubscriptionTransaction.status == 'COMPLETED', func.date(SubscriptionTransaction.timestamp) == d)
        ).scalar() or 0
        
        # Shipments
        ship_rev_day = db.session.query(func.sum(ShipmentItem.fee)).filter(
            and_(ShipmentItem.status != 'CANCELLED', func.date(ShipmentItem.created_at) == d)
        ).scalar() or 0
        
        volume_trend.append({"name": d.strftime("%m-%d"), "value": cnt})
        revenue_trend.append({"name": d.strftime("%m-%d"), "value": sub_rev_day + ship_rev_day})

    # --- 4. Travel/Network Sector ---
    from app.models.travel import Travel
    total_travels = Travel.query.count()
    active_travels = Travel.query.filter_by(status='ACTIVE').count()
    
    # Calculate Capacity Utilization (Shipment Weight / Travel Capacity) - Advanced
    # Sum of all shipment weights currently IN_TRANSIT
    shipping_weight = db.session.query(func.sum(ShipmentItem.weight)).filter(ShipmentItem.status == 'IN_TRANSIT').scalar() or 0
    # Sum of capacity of active travels
    available_capacity_kg = db.session.query(func.sum(Travel.weight_capacity)).filter(Travel.status == 'ACTIVE').scalar() or 0
    
    network_load = (shipping_weight / available_capacity_kg * 100) if available_capacity_kg > 0 else 0
    
    # Top Routes (Origin -> Destination)
    route_stats = db.session.query(
        Travel.origin_country, 
        Travel.destination_country, 
        func.count(Travel.id)
    ).group_by(Travel.origin_country, Travel.destination_country)\
    .order_by(func.count(Travel.id).desc())\
    .limit(5).all()
    
    top_routes = [
        {'origin': origin, 'destination': dest, 'count': count} 
        for origin, dest, count in route_stats
    ]

    # High Impact Travelers (Users with most capacity provided)
    traveler_stats = db.session.query(
        User.first_name,
        User.last_name,
        func.count(Travel.id),
        func.sum(Travel.weight_capacity)
    ).join(Travel, User.id == Travel.user_id)\
    .filter(Travel.status != 'CANCELLED')\
    .group_by(User.id, User.first_name, User.last_name)\
    .order_by(func.sum(Travel.weight_capacity).desc())\
    .limit(5).all()
    
    top_travelers = [
        {'name': f"{fname} {lname}", 'trips': trips, 'total_capacity': capacity}
        for fname, lname, trips, capacity in traveler_stats
    ]

    return jsonify({
        'users': {
            'total': total_users,
            'active_proxy': active_users,
            'distribution': {
                'senders': senders,
                'pickers': pickers,
                'admins': admins
            },
            'growth_rate': round(growth_rate, 2)
        },
        'financial': {
            'total_revenue': round(total_revenue, 2),
            'logistics_volume': round(logistics_volume, 2),
            'subscription_revenue': round(sub_revenue, 2),
            'arpu': round(arpu, 2),
            'trend': revenue_trend
        },
        'logistics': {
            'total_shipments': total_shipments,
            'delivered': delivered_count,
            'conversion_rate': round(conversion_rate, 2),
            'by_status': shipments_by_status,
            'trend': volume_trend,
            'status_trend': status_trend
        },
        'travels': {
            'total': total_travels,
            'active': active_travels,
            'network_load': round(network_load, 2),
            'capacity_kg': available_capacity_kg,
            'top_routes': top_routes,
            'top_travelers': top_travelers
        }
    })
