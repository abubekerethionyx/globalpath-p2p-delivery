from .user_routes import bp as user_bp
from .subscription_routes import bp as subscription_bp
from .shipment_routes import bp as shipment_bp
from .message_routes import bp as message_bp
from .support_routes import bp as support_bp
from .notification_routes import bp as notification_bp
from .admin_routes import bp as admin_bp

def register_routes(app):
    # Register blueprints with v1 API versioning
    app.register_blueprint(user_bp, url_prefix='/api/v1/users')
    app.register_blueprint(subscription_bp, url_prefix='/api/v1/subscriptions')
    app.register_blueprint(shipment_bp, url_prefix='/api/v1/shipments')
    app.register_blueprint(message_bp, url_prefix='/api/v1/messages')
    app.register_blueprint(support_bp, url_prefix='/api/v1/support')
    app.register_blueprint(notification_bp, url_prefix='/api/v1/notifications')
    app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
