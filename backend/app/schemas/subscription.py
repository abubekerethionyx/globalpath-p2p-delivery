from app.extensions import ma
from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from marshmallow_enum import EnumField
from app.models.enums import UserRole

class SubscriptionPlanSchema(ma.SQLAlchemyAutoSchema):
    role = EnumField(UserRole, by_value=True)

    class Meta:
        model = SubscriptionPlan
        load_instance = True

class SubscriptionTransactionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SubscriptionTransaction
        load_instance = True
        include_fk = True
