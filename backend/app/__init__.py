import flask
from flask import Flask, request
from app.config import Config
from app.extensions import db, ma, cors, bcrypt, jwt, mail
from app.routes import register_routes
from app.models import * 

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    
    # Configure CORS - Allow specific origins for the API routes
    cors.init_app(app, resources={r"/api/*": {
        "origins": [
            "https://globalpath.peakstartgc.com",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
        "supports_credentials": True
    }})
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    # Register routes
    register_routes(app)

    # Create tables
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.error(f"Error creating database tables: {e}")
            # Don't crash the whole app if DB init fails initially 
            # (might be just a sync issue on some hosting)

    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        allowed_origins = [
            "https://globalpath.peakstartgc.com",
            "http://localhost:3000",
            "http://localhost:5173"
        ]
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    return app
