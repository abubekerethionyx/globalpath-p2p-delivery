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
    # Admin check
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User, UserRole
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    transactions = subscription_service.get_all_transactions()
    return jsonify(transactions_schema.dump(transactions))

@bp.route('/transactions/<transaction_id>', methods=['PATCH'])
@jwt_required()
def update_transaction(transaction_id):
    # Admin check
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User, UserRole
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != UserRole.ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    status = data.get('status')
    if not status:
        return jsonify({'error': 'Status is required'}), 400
        
    transaction = subscription_service.update_transaction_status(transaction_id, status)
    if not transaction:
        return jsonify({'error': 'Transaction not found or verification failed'}), 404
        
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
                # Use a unique filename to avoid collisions
                ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
                filename = f"receipt_{uuid.uuid4().hex}.{ext}"
                
                upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                data['receipt_url'] = f'/static/uploads/{filename}'
                current_app.logger.info(f"File uploaded successfully: {data['receipt_url']}")
            else:
                current_app.logger.warning("No file found in request.files despite multipart content-type")
        else:
            data = request.get_json()

        if data.get('payment_method') == 'chapa':
            data['status'] = 'COMPLETED'
            if not data.get('transaction_reference'):
                data['transaction_reference'] = f"GP-SUB-{uuid.uuid4().hex[:8].upper()}"

        # Ensure numeric fields are correctly typed
        if 'amount' in data:
            data['amount'] = float(data['amount'])

        new_transaction = subscription_service.create_transaction(data)
        response = transaction_schema.dump(new_transaction)
        
        # If Chapa
        if data.get('payment_method') == 'chapa':
             try:
                 from app.models.user import User
                 from app.models.subscription import SubscriptionPlan
                 user = User.query.get(new_transaction.user_id)
                 plan = SubscriptionPlan.query.get(new_transaction.plan_id)
                 
                 checkout_url = subscription_service.initiate_chapa_payment(new_transaction, user, plan)
                 if checkout_url:
                     response['payment_info'] = {'paymentUrl': checkout_url}
                 else:
                     # Mark as rejected if Chapa failed to initialize
                     subscription_service.update_transaction_status(new_transaction.id, 'REJECTED')
                     response['status'] = 'REJECTED'
                     response['error'] = 'Chapa payment initiation failed'
             except Exception as chapa_err:
                 current_app.logger.error(f"Chapa error in route: {str(chapa_err)}")
                 subscription_service.update_transaction_status(new_transaction.id, 'REJECTED')
                 response['status'] = 'REJECTED'
                 response['error'] = 'Chapa integration error'

        return jsonify(response), 201
    except Exception as e:
        # If we have a transaction partially created, try to mark it as rejected
        current_app.logger.error(f"Global transaction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/callbacks/chapa', methods=['GET', 'POST'])
def chapa_callback():
    """Handle redirection or webhook from Chapa"""
    # Chapa documentation says callback_url receives GET with JSON payload: 
    # { "trx_ref": "...", "ref_id": "...", "status": "success" }
    
    # In practice, usually tx_ref is passed as a query param or JSON
    # Let's try to find tx_ref
    tx_ref = request.args.get('trx_ref') or request.args.get('tx_ref')
    
    if not tx_ref and request.is_json:
        data = request.get_json()
        tx_ref = data.get('trx_ref') or data.get('tx_ref')
        
    if not tx_ref:
        # Check form data just in case
        tx_ref = request.form.get('trx_ref') or request.form.get('tx_ref')

    if not tx_ref:
        return jsonify({'error': 'No transaction reference found'}), 400

    # Trust the callback if tx_ref is found (no need for verification per user request)
    from app.models.subscription import SubscriptionTransaction
    transaction = SubscriptionTransaction.query.filter_by(transaction_reference=tx_ref).first()
    
    if transaction and transaction.status != 'COMPLETED':
        subscription_service.update_transaction_status(transaction.id, 'COMPLETED')
        
    # For GET requests (browser redirection), we should redirect to a success page
    if request.method == 'GET':
        frontend_url = current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:3000')
        return f"<html><script>window.location.href='{frontend_url}/billing?status=success&ref={tx_ref}'</script><body>Processing success...</body></html>"
    
    return jsonify({'status': 'success'}), 200
