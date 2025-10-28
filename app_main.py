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


app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # Support for Czech characters in JSON


@app.route('/')
def index():
    return render_template('index.html')

from db import load_equipment_db, load_bookings_db, load_projects_db

@app.route('/api/data')
def get_all_data():
    equipment = load_equipment_db()
    bookings = load_bookings_db()
    projects = load_projects_db()
    # bookings už obsahuje tma_number
    return jsonify({
        "equipment": equipment,
        "bookings": bookings,
        "projects": projects
    })

app.register_blueprint(bookings_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(equipment_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)