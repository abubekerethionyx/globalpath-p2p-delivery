import sqlite3
import os

db_path = os.path.join('instance', 'app.db')

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"Updating database at {db_path}...")
    
    try:
        cursor.execute("ALTER TABLE shipment_items ADD COLUMN show_address BOOLEAN DEFAULT 0")
        print("Added column show_address")
    except sqlite3.OperationalError:
        print("Column show_address already exists")
        
    try:
        cursor.execute("ALTER TABLE shipment_items ADD COLUMN auto_approve_first BOOLEAN DEFAULT 0")
        print("Added column auto_approve_first")
    except sqlite3.OperationalError:
        print("Column auto_approve_first already exists")
        
    conn.commit()
    conn.close()
    print("Database update complete.")
else:
    print(f"Database not found at {db_path}")
