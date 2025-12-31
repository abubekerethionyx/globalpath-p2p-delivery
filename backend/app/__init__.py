from flask import Flask
from app.config import Config
from app.extensions import db, ma, cors, bcrypt, jwt
from app.routes import register_routes
from app.models import * 

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    cors.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Register routes
    register_routes(app)

    # Create tables
    with app.app_context():
        db.create_all()

    return app
