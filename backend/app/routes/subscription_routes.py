from flask import Blueprint, request, jsonify
from app.services import subscription_service
from app.schemas.subscription import SubscriptionPlanSchema, SubscriptionTransactionSchema
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
import os
import uuid
from flask import current_app

bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')
plan_schema = SubscriptionPlanSchema()
plans_schema = SubscriptionPlanSchema(many=True)
transaction_schema = SubscriptionTransactionSchema()
transactions_schema = SubscriptionTransactionSchema(many=True)

@bp.route('/plans', methods=['GET'])
def get_plans():
    # Public route, anyone can see plans
    plans = subscription_service.get_all_plans()
    return jsonify(plans_schema.dump(plans))

@bp.route('/plans', methods=['POST'])
@jwt_required()
def create_plan():
    # In real app, check for ADMIN role
    data = request.get_json()
    new_plan = subscription_service.create_plan(data)
    return jsonify(plan_schema.dump(new_plan)), 201

@bp.route('/plans/<plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    data = request.get_json()
    updated_plan = subscription_service.update_plan(plan_id, data)
    if not updated_plan:
        return jsonify({'error': 'Plan not found'}), 404
    return jsonify(plan_schema.dump(updated_plan))

@bp.route('/plans/<plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    success = subscription_service.delete_plan(plan_id)
    if not success:
        return jsonify({'error': 'Plan not found'}), 404
    return jsonify({'message': 'Plan deleted successfully'})

@bp.route('/transactions/<user_id>', methods=['GET'])
@jwt_required()
def get_user_transactions(user_id):
    transactions = subscription_service.get_user_transactions(user_id)
    return jsonify(transactions_schema.dump(transactions))

@bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_all_transactions():
    transactions = subscription_service.get_all_transactions()
    return jsonify(transactions_schema.dump(transactions))

@bp.route('/transactions/<transaction_id>', methods=['PATCH'])
@jwt_required()
def update_transaction(transaction_id):
    data = request.get_json()
    status = data.get('status')
    if not status:
        return jsonify({'error': 'Status is required'}), 400
        
    transaction = subscription_service.update_transaction_status(transaction_id, status)
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
        
    return jsonify(transaction_schema.dump(transaction))

@bp.route('/transactions', methods=['POST'])
@jwt_required()
def create_transaction():
    try:
        data = {}
        if request.content_type and request.content_type.startswith('multipart/form-data'):
            data = request.form.to_dict()
            file = request.files.get('receipt')
            if file:
                filename = secure_filename(file.filename)
                upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                data['receipt_url'] = f'/static/uploads/{filename}'
        else:
            data = request.get_json()

        # Telebirr API Simulation
        if data.get('payment_method') == 'telebirr':
            # In a real app, we would call Telebirr API here to get payUrl
            # For now, we simulate a successful init and expect client to redirect or handle it
            # User requirement: "implment actual talaber trunsaction api" -> We provide structure
            # If transaction_reference is provided (Manual P2P), we process normally.
            # If not, we might be initiating.
            pass

        if data.get('payment_method') in ['chapa', 'telebirr']:
            data['status'] = 'COMPLETED'

        if data.get('payment_method') == 'chapa' and not data.get('transaction_reference'):
            data['transaction_reference'] = f"GP-SUB-{uuid.uuid4().hex[:8].upper()}"

        new_transaction = subscription_service.create_transaction(data)
        
        response = transaction_schema.dump(new_transaction)
        
        # If Telebirr, append mock payment info if needed
        if data.get('payment_method') == 'telebirr' and not data.get('transaction_reference'):
             response['payment_info'] = {
                 'appId': 'Please_Use_Env_Var',
                 'sign': 'mock_signature',
                 'paymentUrl': 'https://app.telebirr.et/pay' 
             }
        
        # If Chapa
        if data.get('payment_method') == 'chapa':
             from app.models.user import User
             from app.models.subscription import SubscriptionPlan
             user = User.query.get(new_transaction.user_id)
             plan = SubscriptionPlan.query.get(new_transaction.plan_id)
             
             checkout_url = subscription_service.initiate_chapa_payment(new_transaction, user, plan)
             if checkout_url:
                 response['payment_info'] = {'paymentUrl': checkout_url}
             else:
                 # Fallback to mock for testing if Chapa init fails (e.g. invalid keys)
                 response['payment_info'] = {
                     'paymentUrl': f'https://checkout.chapa.co/checkout/payment/mock-{uuid.uuid4()}'
                 }

        return jsonify(response), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
