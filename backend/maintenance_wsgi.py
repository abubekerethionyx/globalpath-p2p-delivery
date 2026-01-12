import sys
import os

# Set up the path for the maintenance runner
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from maintenance_runner import application
