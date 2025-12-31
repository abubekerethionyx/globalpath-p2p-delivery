# Backend Fix: Date Parsing for Registration

## Issue
- PUT `/api/users/<id>/registration` returned 500 error.
- Cause: `builtins.TypeError: SQLite DateTime type only accepts Python datetime and date objects as input`.
- The frontend sends dates as strings (`"YYYY-MM-DD"`), but SQLAlchemy's SQLite dialect demands Python `datetime` objects.

## Fix
- Modified `backend/app/routes/user_routes.py`.
- Added `from datetime import datetime` import.
- Updated `update_registration` loop to check for `passport_expiry` and `date_of_birth` keys.
- Applied `datetime.strptime(val, '%Y-%m-%d')` conversion for these fields.
- Applied the same fix to `verify_user` route for consistency.

## Verification
- User registration and verification updates containing date fields will now process correctly without crashing the server.
