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
    CHAPA_SECRET_KEY = os.environ.get('CHAPA_SECRET_KEY') or "CHASECK_TEST-N5nTwIsv2PAtDrefhfk42OKhaSWRlsxF"
    CHAPA_PUBLIC_KEY = os.environ.get('CHAPA_PUBLIC_KEY') or "CHAPUBK_TEST-Bq0DcJlxmDKUzI4rJ44S3t1jdaV44OmU"
    CHAPA_BASE_URL = "https://api.chapa.co/v1"
    CHAPA_CALLBACK_URL = f"{BACKEND_BASE_URL}/api/subscriptions/callbacks/chapa"
    CHAPA_RETURN_URL = f"{BACKEND_BASE_URL}/api/subscriptions/callbacks/chapa"
    CHAPA_WEBHOOK_SECRET = os.environ.get('CHAPA_WEBHOOK_SECRET') or "CHASECK_TEST-N5nTwIsv2PAtDrefhfk42OKhaSWRlsxF"
