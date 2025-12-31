from flask import Blueprint, request, jsonify, current_app, url_for
from app.services import user_service
from app.models.enums import UserRole, VerificationStatus
from app.schemas.user import UserSchema
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from datetime import datetime

bp = Blueprint('users', __name__, url_prefix='/api/users')
user_schema = UserSchema()
users_schema = UserSchema(many=True)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    user = user_service.create_user(data)
    if not user:
        return jsonify({'message': 'User already exists'}), 400
    
    return jsonify(user_schema.dump(user)), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    result = user_service.authenticate_user(data['email'], data['password'])
    if not result:
        return jsonify({'message': 'Invalid credentials'}), 401
    
    return jsonify({
        'token': result['token'],
        'user': user_schema.dump(result['user'])
    }), 200

@bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    users = user_service.get_all_users()
    return jsonify(users_schema.dump(users))

@bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = user_service.get_user(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user_schema.dump(user))

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = user_service.get_user(current_user_id)
    return jsonify(user_schema.dump(user))

@bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = user_service.get_user(current_user_id)
    
    # Basic authorization check: only allow users to update themselves or admin
    if current_user_id != user_id and current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    
    # Security: Prevent users from changing their own verification status
    # Only admins can update verification_status
    if current_user.role != UserRole.ADMIN and 'verification_status' in data:
        return jsonify({'message': 'Only admins can update verification status'}), 403

    # Logic: If sensitive fields change, revert to PENDING (unless Admin)
    sensitive_fields = ['passport_number', 'national_id', 'id_front_url', 'id_back_url', 'selfie_url', 'liveness_video', 'id_type']
    if any(field in data for field in sensitive_fields) and current_user.role != UserRole.ADMIN:
         data['verification_status'] = VerificationStatus.PENDING
    
    user = user_service.update_user(user_id, data)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user_schema.dump(user))

@bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = user_service.delete_user(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'message': 'User deleted successfully'}), 200


@bp.route('/<user_id>/registration', methods=['PUT'])
@jwt_required()
def update_registration(user_id):
    """
    Update user information during picker registration process.
    This endpoint handles all registration data including form fields and file uploads.
    """
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403

    user = user_service.get_user(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Handle form data - map camelCase to snake_case
    form_data = request.form.to_dict()
    
    # Field mapping from camelCase (frontend) to snake_case (backend)
    field_mapping = {
        'idType': 'id_type',
        'nationalId': 'national_id',
        'passportNumber': 'passport_number',
        'passportExpiry': 'passport_expiry',
        'issuanceCountry': 'issuance_country',
        'phoneNumber': 'phone_number',
        'homeAddress': 'home_address',
        'emergencyContact': 'emergency_contact',
        'emergencyContactPhone': 'emergency_contact_phone',
        'dateOfBirth': 'date_of_birth'
    }
    
    # Transform camelCase to snake_case
    data = {}
    for frontend_key, backend_key in field_mapping.items():
        if frontend_key in form_data:
            val = form_data[frontend_key]
            # Handle Date Fields
            if backend_key in ['passport_expiry', 'date_of_birth'] and val:
                try:
                    data[backend_key] = datetime.strptime(val, '%Y-%m-%d')
                except ValueError:
                    pass
            else:
                data[backend_key] = val
    
    # Handle File Uploads
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    file_mapping = {
        'idFront': 'id_front_url',
        'idBack': 'id_back_url',
        'selfie': 'selfie_url',
        'livenessVideo': 'liveness_video'
    }

    for form_key, model_key in file_mapping.items():
        if form_key in request.files:
            file = request.files[form_key]
            if file.filename != '':
                filename = secure_filename(f"{user_id}_{form_key}_{file.filename}")
                file_path = os.path.join(upload_dir, filename)
                file.save(file_path)
                
                # Construct URL
                file_url = f"{request.host_url}static/uploads/{filename}"
                data[model_key] = file_url

    # Set verification_status to PENDING after registration is complete
    data['verification_status'] = 'PENDING'

    # Update user with all registration data
    try:
        updated_user = user_service.update_user(user_id, data)
        return jsonify(user_schema.dump(updated_user)), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@bp.route('/<user_id>/verify', methods=['POST'])
@jwt_required()
def verify_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = user_service.get_user(current_user_id)
    
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'message': 'Unauthorized. Admin role required.'}), 403

    user = user_service.get_user(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Admin Action: Approve User
    updated_user = user_service.update_user(user_id, {'verification_status': VerificationStatus.VERIFIED})
    return jsonify(user_schema.dump(updated_user)), 200
@bp.route('/<user_id>/avatar', methods=['POST'])
@jwt_required()
def update_avatar(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403

    if 'avatar' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    filename = secure_filename(f"avatar_{user_id}_{file.filename}")
    file_path = os.path.join(upload_dir, filename)
    file.save(file_path)

    # Construct URL
    file_url = f"{request.host_url}static/uploads/{filename}"
    
    user = user_service.update_user(user_id, {'avatar': file_url})
    return jsonify(user_schema.dump(user)), 200
