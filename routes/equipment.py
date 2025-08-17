from flask import Blueprint, request, jsonify
from db import db_connect, load_equipment_db

equipment_bp = Blueprint('equipment', __name__)

@equipment_bp.route('/api/equipment', methods=['GET'])
def get_equipment():
    equipment = load_equipment_db()
    return jsonify({"equipment": equipment})

@equipment_bp.route('/api/equipment', methods=['POST'])
def create_equipment():
    new_equip = request.json
    if not new_equip.get('name') or not new_equip.get('category'):
        return jsonify({"error": "Chybí název nebo kategorie zařízení"}), 400
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT name FROM equipment WHERE name=?', (new_equip['name'],))
    if c.fetchone():
        conn.close()
        return jsonify({"error": "Zařízení s tímto názvem již existuje"}), 409
    c.execute('''INSERT INTO equipment (name, category, max_tests, sides, status) VALUES (?, ?, ?, ?, ?)''', (
        new_equip['name'],
        new_equip['category'],
        int(new_equip.get('max_tests', 1)),
        int(new_equip.get('sides', 1)),
        new_equip.get('status', 'active')
    ))
    conn.commit()
    conn.close()
    return jsonify(new_equip), 201

@equipment_bp.route('/api/equipment/<equip_name>', methods=['PUT'])
def update_equipment(equip_name):
    updated_equip = request.json
    conn = db_connect()
    c = conn.cursor()
    c.execute('''UPDATE equipment SET category=?, max_tests=?, sides=?, status=? WHERE name=?''', (
        updated_equip.get('category'),
        int(updated_equip.get('max_tests', 1)),
        int(updated_equip.get('sides', 1)),
        updated_equip.get('status', 'active'),
        equip_name
    ))
    conn.commit()
    conn.close()
    return jsonify(updated_equip)

@equipment_bp.route('/api/equipment/<equip_name>', methods=['DELETE'])
def delete_equipment(equip_name):
    conn = db_connect()
    c = conn.cursor()
    c.execute('DELETE FROM equipment WHERE name=?', (equip_name,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200
