from flask import Blueprint, request, jsonify
from db import db_connect, load_bookings_db, load_equipment_db
from utils import validate_booking_data, check_collision
import json

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/api/bookings', methods=['POST'])
def create_booking():
    new_booking_data = request.json
    is_valid, error_message = validate_booking_data(new_booking_data)
    if not is_valid:
        return jsonify({"error": error_message}), 400
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT MAX(id) FROM bookings')
    max_id = c.fetchone()[0]
    new_id = (max_id or 100) + 1
    new_booking_data['id'] = new_id
    all_bookings = load_bookings_db()
    all_equipment = load_equipment_db()
    if check_collision(new_booking_data, all_bookings, all_equipment):
        conn.close()
        return jsonify({"error": "Booking collision detected or capacity exceeded"}), 409
    c.execute('''INSERT INTO bookings (id, description, start_date, end_date, equipment_id, project_name, project_color, note, is_blocker, text_style)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', (
        new_id,
        new_booking_data.get('description'),
        new_booking_data.get('start_date'),
        new_booking_data.get('end_date'),
        new_booking_data.get('equipment_id'),
        new_booking_data.get('project_name'),
        new_booking_data.get('project_color'),
        new_booking_data.get('note'),
        int(new_booking_data.get('is_blocker', False)),
        json.dumps(new_booking_data.get('text_style', {}))
    ))
    conn.commit()
    conn.close()
    return jsonify(new_booking_data), 201

@bookings_bp.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    updated_booking_data = request.json
    is_valid, error_message = validate_booking_data(updated_booking_data)
    if not is_valid:
        return jsonify({"error": error_message}), 400
    updated_booking_data['id'] = booking_id
    all_bookings = load_bookings_db()
    all_equipment = load_equipment_db()
    if check_collision(updated_booking_data, all_bookings, all_equipment):
        return jsonify({"error": "Booking collision detected or capacity exceeded"}), 409
    conn = db_connect()
    c = conn.cursor()
    c.execute('''UPDATE bookings SET description=?, start_date=?, end_date=?, equipment_id=?, project_name=?, project_color=?, note=?, is_blocker=?, text_style=? WHERE id=?''', (
        updated_booking_data.get('description'),
        updated_booking_data.get('start_date'),
        updated_booking_data.get('end_date'),
        updated_booking_data.get('equipment_id'),
        updated_booking_data.get('project_name'),
        updated_booking_data.get('project_color'),
        updated_booking_data.get('note'),
        int(updated_booking_data.get('is_blocker', False)),
        json.dumps(updated_booking_data.get('text_style', {})),
        booking_id
    ))
    conn.commit()
    conn.close()
    return jsonify(updated_booking_data)

@bookings_bp.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    conn = db_connect()
    c = conn.cursor()
    c.execute('DELETE FROM bookings WHERE id=?', (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200
