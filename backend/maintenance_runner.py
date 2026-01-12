from flask import Flask, jsonify, request
import requests
import os
from datetime import datetime

app = Flask(__name__)

# --- Configuration ---
# Update these via environment variables in cPanel for better security
BASE_URL = os.environ.get('CORE_API_URL') or "https://globalpathnewapi.peakstartgc.com/api/v1"
ADMIN_EMAIL = os.environ.get('MAINTENANCE_ADMIN_EMAIL') or "admin@globalpath.com"
ADMIN_PASSWORD = os.environ.get('MAINTENANCE_ADMIN_PASSWORD') or "admin123"
# A secret key to prevent unauthorized triggers: yourdomain.com/run?key=xyz
MAINTENANCE_KEY = os.environ.get('MAINTENANCE_KEY') or "globalpath-maintenance-secure-key-2024"

def get_auth_token():
    """Authenticates with the core API to get a JWT token."""
    try:
        login_resp = requests.post(f"{BASE_URL}/users/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=15)
        
        if login_resp.status_code != 200:
            return None, f"Auth failed: {login_resp.status_code}"
            
        auth_data = login_resp.json()
        return auth_data.get('token'), None
        
    except Exception as e:
        return None, str(e)

@app.route('/')
def health_check():
    return jsonify({
        "status": "online",
        "service": "GlobalPath Maintenance Protocol",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/run')
def run_maintenance():
    # Security Check
    key = request.args.get('key')
    if key != MAINTENANCE_KEY:
        return jsonify({"error": "Unauthorized Access Denied. Invalid Protocol Key."}), 401

    token, err = get_auth_token()
    if err:
        return jsonify({"error": "Authentication Failed", "details": err}), 500

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Trigger the actual maintenance logic on the main core API
        maint_resp = requests.post(f"{BASE_URL}/admin/maintenance/run", headers=headers, timeout=300)
        
        if maint_resp.status_code == 200:
            return jsonify({
                "status": "success",
                "message": "Maintenance protocol synchronized successfully",
                "core_response": maint_resp.json()
            }), 200
        else:
            return jsonify({
                "status": "failure",
                "code": maint_resp.status_code,
                "message": "Core API rejected maintenance request"
            }), 502
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            "status": "error",
            "message": "Connection to Core API interrupted",
            "details": str(e)
        }), 504

# For cPanel/Passenger
application = app

if __name__ == "__main__":
    app.run(port=5001)
