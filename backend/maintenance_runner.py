import requests
import json
import os
import sys
import time
from datetime import datetime

# Configuration - Update these for your production environment if necessary
BASE_URL = "http://localhost:5000/api"
ADMIN_EMAIL = "admin@globalpath.com"
ADMIN_PASSWORD = "admin123" # Use an environment variable in production

def get_auth_token():
    print(f"[{datetime.now()}] Authenticating as {ADMIN_EMAIL}...")
    try:
        login_resp = requests.post(f"{BASE_URL}/users/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=15)
        
        if login_resp.status_code != 200:
            print(f"CRITICAL: Authentication failed with status {login_resp.status_code}")
            return None
            
        auth_data = login_resp.json()
        return auth_data.get('token')
        
    except requests.exceptions.RequestException as e:
        print(f"CRITICAL: Connection to API failed: {str(e)}")
        return None

def get_maintenance_interval(token):
    print(f"[{datetime.now()}] Fetching system heartbeat interval...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        settings_resp = requests.get(f"{BASE_URL}/admin/settings", headers=headers, timeout=15)
        if settings_resp.status_code == 200:
            settings = settings_resp.json()
            interval_info = settings.get('maintenance_interval_hours')
            if interval_info:
                try:
                    return float(interval_info.get('value', 24))
                except ValueError:
                    pass
        return 24.0 # Default
    except Exception as e:
        print(f"WARNING: Could not fetch interval, using 24h default. Error: {str(e)}")
        return 24.0

def trigger_maintenance(token):
    print(f"[{datetime.now()}] Broadcasting maintenance trigger to Core Index...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        maint_resp = requests.post(f"{BASE_URL}/admin/maintenance/run", headers=headers, timeout=120)
        
        if maint_resp.status_code == 200:
            data = maint_resp.json()
            print(f"SUCCESS: Core protocols synchronized. Response: {data.get('message')}")
            return True
        else:
            print(f"FAILURE: Maintenance protocol rejected with status {maint_resp.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"CRITICAL: Maintenance broadcast interrupted: {str(e)}")
        return False

def run_loop():
    print("--- GlobalPath Maintenance Microservice Initialized ---")
    
    while True:
        token = get_auth_token()
        if not token:
            print("Retrying authentication in 60 seconds...")
            time.sleep(60)
            continue
            
        # Execute maintenance
        trigger_maintenance(token)
        
        # Get next interval
        interval_hours = get_maintenance_interval(token)
        interval_seconds = interval_hours * 3600
        
        print(f"[{datetime.now()}] Maintenance cycle complete. Next cycle in {interval_hours} hours.")
        print(f"--- Resting until next protocol synchronization ---")
        
        time.sleep(interval_seconds)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
    
    try:
        run_loop()
    except KeyboardInterrupt:
        print("\n--- Maintenance Service Terminated by User ---")
        sys.exit(0)
