from .user_routes import bp as user_bp
from .subscription_routes import bp as subscription_bp
from .shipment_routes import bp as shipment_bp
from .message_routes import bp as message_bp
from .support_routes import bp as support_bp
from .notification_routes import bp as notification_bp
from .admin_routes import bp as admin_bp

def register_routes(app):
    app.register_blueprint(user_bp)
    app.register_blueprint(subscription_bp)
    app.register_blueprint(shipment_bp)
    app.register_blueprint(message_bp)
    app.register_blueprint(support_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(admin_bp)
