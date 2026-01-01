from app.extensions import ma
from app.models.message import Message, MessageThread
from marshmallow import fields

class MessageSchema(ma.SQLAlchemyAutoSchema):
    sender = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'name', 'avatar'))
    receiver = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'name', 'avatar'))
    
    class Meta:
        model = Message
        load_instance = True
        include_fk = True

class MessageThreadSchema(ma.SQLAlchemyAutoSchema):
    participant1 = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'name', 'avatar'))
    participant2 = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'name', 'avatar'))
    last_message = fields.Method("get_last_message_content")
    shipment = fields.Nested('ShipmentItemSchema', only=('id', 'status', 'pickup_country', 'dest_country', 'category'))

    def get_last_message_content(self, obj):
        # Efficiently get last message if not stored
        if obj.messages:
            # Sort by timestamp desc and get first
            sorted_msgs = sorted(obj.messages, key=lambda x: x.timestamp, reverse=True)
            return sorted_msgs[0].text if sorted_msgs else None
        return None

    class Meta:
        model = MessageThread
        load_instance = True
        include_fk = True
