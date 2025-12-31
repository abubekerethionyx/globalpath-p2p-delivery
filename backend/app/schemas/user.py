from app.extensions import ma
from app.models.user import User
from marshmallow_enum import EnumField
from app.models.enums import UserRole, VerificationStatus

class UserSchema(ma.SQLAlchemyAutoSchema):
    role = EnumField(UserRole, by_value=True)
    verification_status = EnumField(VerificationStatus, by_value=True)
    
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ('password_hash',) # Don't expose password hash
