from app.extensions import db

class GlobalSetting(db.Model):
    __tablename__ = 'global_settings'

    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, onupdate=db.func.now(), default=db.func.now())

    @staticmethod
    def get_value(key, default=None):
        setting = GlobalSetting.query.get(key)
        if setting:
            if setting.value.lower() == 'true': return True
            if setting.value.lower() == 'false': return False
            return setting.value
        return default

    @staticmethod
    def set_value(key, value, description=None):
        setting = GlobalSetting.query.get(key)
        if not setting:
            setting = GlobalSetting(key=key, value=str(value), description=description)
            db.session.add(setting)
        else:
            setting.value = str(value)
            if description:
                setting.description = description
        db.session.commit()
        return setting
