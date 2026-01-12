import os
import sys

# Add the current directory to the path so the 'app' package can be found
# correctly when running through cPanel's Passenger WSGI.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

# The main Flask application instance
app = create_app()

# cPanel/Passenger looks for an object named 'application' by default
application = app

if __name__ == '__main__':
    # Local development settings
    app.run(debug=True, host='0.0.0.0', port=5000)
