from app.extensions import ma
from app.models.shipment import ShipmentItem
from marshmallow_enum import EnumField
from app.models.enums import ItemStatus
from marshmallow import fields

class ShipmentItemSchema(ma.SQLAlchemyAutoSchema):
    status = EnumField(ItemStatus, by_value=True)
    # Include nested sender and partner user information
    # UserSchema already excludes password_hash in its Meta class
    sender = fields.Nested('UserSchema')
    partner = fields.Nested('UserSchema', allow_none=True)

    class Meta:
        model = ShipmentItem
        load_instance = True
        include_fk = True
