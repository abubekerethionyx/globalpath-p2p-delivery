import os
from datetime import timedelta

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key-change-this'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-super-secret-key-change-this'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)

    # Chapa Configuration
    BACKEND_BASE_URL = os.environ.get('BACKEND_BASE_URL') or 'http://localhost:5000'
    FRONTEND_BASE_URL = os.environ.get('FRONTEND_BASE_URL') or 'http://localhost:3000'
    CHAPA_SECRET_KEY = os.environ.get('CHAPA_SECRET_KEY') or "CHASECK_TEST-YNLcpxXgbqbm7U47PTjvbfw6CA3f7XZj"
    CHAPA_PUBLIC_KEY = os.environ.get('CHAPA_PUBLIC_KEY') or "CHAPUBK_TEST-4Lg9EORISl9A89R0FwgLWcpJt3TRkAx8"
    CHAPA_BASE_URL = "https://api.chapa.co/v1"
    CHAPA_CALLBACK_URL = f"{BACKEND_BASE_URL}/api/subscriptions/callbacks/chapa"
    CHAPA_RETURN_URL = f"{FRONTEND_BASE_URL}/billing"
    CHAPA_WEBHOOK_SECRET = os.environ.get('CHAPA_WEBHOOK_SECRET') or "CHASECK_TEST-YNLcpxXgbqbm7U47PTjvbfw6CA3f7XZj"

    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or 'abubekermubarek7545@gmail.com'
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') or 'vfnn snpl dibp uzzr'
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'abubekermubarek7545@gmail.com'
    MAIL_FROM_NAME = os.environ.get('MAIL_FROM_NAME') or 'GlobalPath Logistics'
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or "40182803174-dijfcrlpuu2du8ptq8hiha4e57h7pirf.apps.googleusercontent.com"

    # Default Subscription Plans
    DEFAULT_SENDER_PLAN_ID = os.environ.get('DEFAULT_SENDER_PLAN_ID') or 's-free-promo-6mo'
    DEFAULT_PICKER_PLAN_ID = os.environ.get('DEFAULT_PICKER_PLAN_ID') or 'p-free-promo-6mo'
    IS_FREE_PROMO_ENABLED_FOR_SENDER= os.environ.get('IS_FREE_PROMO_ENABLED_FOR_SENDER') or True
    IS_FREE_PROMO_ENABLED_FOR_PICKER= os.environ.get('IS_FREE_PROMO_ENABLED_FOR_PICKER') or True