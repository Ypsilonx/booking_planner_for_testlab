"""
Booking Planner for Test Lab - Main Application

Flask application for managing test laboratory equipment bookings.
Supports multiple projects, equipment capacity management, and blocker reservations.

Author: Your Name
Version: 2.0.0
"""

from flask import Flask, render_template, jsonify
from routes.bookings import bookings_bp
from routes.projects import projects_bp
from routes.equipment import equipment_bp
from routes.equipment_mgmt import equipment_mgmt_bp
from db import load_equipment_db, load_bookings_db, load_projects_db
from config import APP_HOST, APP_PORT, APP_DEBUG

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # Support for Czech characters in JSON


@app.route('/')
def index():
    """Render main application page."""
    return render_template('index.html')


@app.route('/api/data')
def get_all_data():
    """
    Get all application data (equipment, bookings, projects).
    
    Returns:
        JSON response with equipment, bookings, and projects lists
    """
    try:
        equipment = load_equipment_db()
        bookings = load_bookings_db()
        projects = load_projects_db()
        return jsonify({
            "equipment": equipment,
            "bookings": bookings,
            "projects": projects
        })
    except Exception as e:
        return jsonify({"error": f"Chyba při načítání dat: {str(e)}"}), 500

# Register blueprints
app.register_blueprint(bookings_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(equipment_bp)
app.register_blueprint(equipment_mgmt_bp)


if __name__ == '__main__':
    app.run(host=APP_HOST, port=APP_PORT, debug=APP_DEBUG)