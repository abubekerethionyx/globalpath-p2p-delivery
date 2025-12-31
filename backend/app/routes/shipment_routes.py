from flask import Blueprint, request, jsonify
from app.services import shipment_service
from app.schemas.shipment import ShipmentItemSchema
from app.models.enums import ItemStatus
from flask_jwt_extended import jwt_required, get_jwt_identity

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
    data = request.get_json()
    data['sender_id'] = current_user_id # Automatically set sender
    new_shipment = shipment_service.create_shipment(data)
    return jsonify(shipment_schema.dump(new_shipment)), 201

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
    shipment = shipment_service.pick_shipment(shipment_id, current_user_id)
    if not shipment:
        return jsonify({'message': 'Shipment not found or already picked'}), 400
    return jsonify(shipment_schema.dump(shipment))
