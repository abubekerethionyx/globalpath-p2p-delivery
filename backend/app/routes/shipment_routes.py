from flask import Blueprint, request, jsonify, current_app
from app.services import shipment_service
from app.schemas.shipment import ShipmentItemSchema
from app.models.enums import ItemStatus
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os

bp = Blueprint('shipments', __name__, url_prefix='/api/shipments')
shipment_schema = ShipmentItemSchema()
shipments_schema = ShipmentItemSchema(many=True)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_shipments():
    shipments = shipment_service.get_all_shipments()
    return jsonify(shipments_schema.dump(shipments))

@bp.route('/<shipment_id>', methods=['GET'])
@jwt_required()
def get_shipment(shipment_id):
    shipment = shipment_service.get_shipment(shipment_id)
    if not shipment:
        return jsonify({'message': 'Shipment not found'}), 404
    return jsonify(shipment_schema.dump(shipment))

@bp.route('/', methods=['POST'])
@jwt_required()
def create_shipment():
    current_user_id = get_jwt_identity()
    
    # Handle multipart/form-data
    print(f"DEBUG: FormData keys: {list(request.form.keys())}")
    print(f"DEBUG: FormData values: {dict(request.form)}")
    data = request.form.to_dict()
    data['sender_id'] = current_user_id
    
    # Convert types
    try:
        from datetime import datetime
        if 'weight' in data and data['weight']:
            data['weight'] = float(data['weight'])
        if 'fee' in data and data['fee']:
            data['fee'] = float(data['fee'])
        if 'availablePickupTime' in data and data['availablePickupTime']:
             # Frontend sends ISO string e.g. "2023-10-27T10:30"
             data['available_pickup_time'] = datetime.fromisoformat(data['availablePickupTime'])
             del data['availablePickupTime']  # Remove camelCase key
    except ValueError as e:
        return jsonify({'message': f'Invalid type: {str(e)}'}), 400

    # Handle image uploads
    image_urls = []
    if 'images' in request.files:
        files = request.files.getlist('images')
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Ensure unique filename to prevent overwriting
                import uuid
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(upload_folder, unique_filename))
                # Store relative URL
                image_urls.append(f"/static/uploads/{unique_filename}")
    
    data['image_urls'] = image_urls

    new_shipment = shipment_service.create_shipment(data)
    return jsonify(shipment_schema.dump(new_shipment)), 201

@bp.route('/<shipment_id>', methods=['PUT'])
@jwt_required()
def update_shipment(shipment_id):
    current_user_id = get_jwt_identity()
    
    # Check if shipment exists and belongs to current user
    existing_shipment = shipment_service.get_shipment(shipment_id)
    if not existing_shipment:
        return jsonify({'message': 'Shipment not found'}), 404
    
    if existing_shipment.sender_id != current_user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Only allow editing if status is POSTED or APPROVED (before partner confirms pickup)
    allowed_statuses = ['POSTED', 'REQUESTED', 'APPROVED']
    if existing_shipment.status.value not in allowed_statuses:
        return jsonify({'message': f'Cannot edit shipment with status {existing_shipment.status}. Only POSTED, REQUESTED or APPROVED shipments can be edited.'}), 400
    
    # Handle multipart/form-data (same as create)
    data = request.form.to_dict()
    
    # Convert types
    try:
        from datetime import datetime
        if 'weight' in data and data['weight']:
            data['weight'] = float(data['weight'])
        if 'fee' in data and data['fee']:
            data['fee'] = float(data['fee'])
        if 'availablePickupTime' in data and data['availablePickupTime']:
            data['available_pickup_time'] = datetime.fromisoformat(data['availablePickupTime'])
            del data['availablePickupTime']
    except ValueError as e:
        return jsonify({'message': f'Invalid type: {str(e)}'}), 400

    # Handle image uploads (append to existing if new ones provided)
    image_urls = existing_shipment.image_urls or []
    if 'images' in request.files:
        files = request.files.getlist('images')
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                import uuid
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(upload_folder, unique_filename))
                image_urls.append(f"/static/uploads/{unique_filename}")
    
    data['image_urls'] = image_urls

    updated_shipment = shipment_service.update_shipment(shipment_id, data)
    return jsonify(shipment_schema.dump(updated_shipment)), 200

@bp.route('/<shipment_id>/status', methods=['PUT'])
@jwt_required()
def update_status(shipment_id):
    data = request.get_json()
    status_str = data.get('status')
    try:
        status_enum = ItemStatus(status_str)
        shipment = shipment_service.update_shipment_status(shipment_id, status_enum)
        if not shipment:
            return jsonify({'message': 'Shipment not found'}), 404
        return jsonify(shipment_schema.dump(shipment))
    except ValueError:
        return jsonify({'message': 'Invalid status'}), 400

@bp.route('/<shipment_id>/pick', methods=['POST'])
@jwt_required()
def pick_shipment(shipment_id):
    current_user_id = get_jwt_identity()
    try:
        req = shipment_service.pick_shipment(shipment_id, current_user_id)
        return jsonify({'message': 'Request sent successfully', 'status': req.status, 'request_id': req.id}), 201
    except ValueError as e:
         return jsonify({'message': str(e)}), 400

@bp.route('/<shipment_id>/requests', methods=['GET'])
@jwt_required()
def get_shipment_requests(shipment_id):
    current_user_id = get_jwt_identity()
    shipment = shipment_service.get_shipment(shipment_id)
    if not shipment:
        return jsonify({'message': 'Shipment not found'}), 404
    
    # Only sender (or admin) can see requests
    if shipment.sender_id != current_user_id: # Add admin check if needed
        return jsonify({'message': 'Unauthorized'}), 403

    requests = shipment_service.get_shipment_requests(shipment_id)
    result = []
    for r in requests:
        result.append({
            'id': r.id,
            'picker': {
                'id': r.picker.id,
                'firstName': r.picker.first_name,
                'lastName': r.picker.last_name,
                'email': r.picker.email,
                'verificationStatus': r.picker.verification_status.value if r.picker.verification_status else 'UNVERIFIED'
            },
            'status': r.status,
            'created_at': r.created_at.isoformat()
        })
    return jsonify(result)

@bp.route('/request/<request_id>/approve', methods=['POST'])
@jwt_required()
def approve_request(request_id):
    # current_user_id = get_jwt_identity() # Should verify sender owns the shipment
    # Service doesn't check owner currently, relying on frontend calling right ID. 
    # Ideally should check ownership here.
    try:
        shipment = shipment_service.approve_request(request_id)
        return jsonify(shipment_schema.dump(shipment)), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

@bp.route('/request/<request_id>/reject', methods=['POST'])
@jwt_required()
def reject_request(request_id):
    try:
        req = shipment_service.reject_request(request_id)
        return jsonify({'message': 'Request rejected', 'status': req.status})
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

@bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    current_user_id = get_jwt_identity()
    requests = shipment_service.get_picker_requests(current_user_id)
    result = []
    for r in requests:
        result.append({
            'id': r.id,
            'status': r.status,
            'shipment': shipment_schema.dump(r.shipment),
            'created_at': r.created_at.isoformat()
        })
    return jsonify(result)
