"""Equipment API routes.

Handles CRUD operations for equipment:
- GET /api/equipment - Get all equipment
- POST /api/equipment - Create new equipment
- PUT /api/equipment/<name> - Update existing equipment
- DELETE /api/equipment/<name> - Delete equipment
"""

from flask import Blueprint, request, jsonify
from typing import Tuple
from db import db_connect, load_equipment_db
from config import DEFAULT_EQUIPMENT_STATUS, DEFAULT_MAX_TESTS, DEFAULT_SIDES

equipment_bp = Blueprint('equipment', __name__)

@equipment_bp.route('/api/equipment', methods=['GET'])
def get_equipment() -> Tuple[dict, int]:
    """
    Get all equipment.
    
    Returns:
        JSON response with equipment list
    """
    try:
        equipment = load_equipment_db()
        return jsonify({"equipment": equipment})
    except Exception as e:
        return jsonify({"error": f"Chyba při načítání zařízení: {str(e)}"}), 500

@equipment_bp.route('/api/equipment', methods=['POST'])
def create_equipment() -> Tuple[dict, int]:
    """
    Create new equipment.
    
    Expected JSON body:
        - name: str (required)
        - category: str (required)
        - max_tests: int (optional, default from config)
        - sides: int (optional, default from config)
        - status: str (optional, default from config)
    
    Returns:
        JSON response with created equipment data and 201 status
        or error message with appropriate error status
    """
    try:
        new_equip = request.json
        if not new_equip:
            return jsonify({"error": "Chybí data zařízení"}), 400
            
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
            int(new_equip.get('max_tests', DEFAULT_MAX_TESTS)),
            int(new_equip.get('sides', DEFAULT_SIDES)),
            new_equip.get('status', DEFAULT_EQUIPMENT_STATUS)
        ))
        conn.commit()
        conn.close()
        return jsonify(new_equip), 201
    except Exception as e:
        return jsonify({"error": f"Chyba při vytváření zařízení: {str(e)}"}), 500

@equipment_bp.route('/api/equipment/<equip_name>', methods=['PUT'])
def update_equipment(equip_name: str) -> Tuple[dict, int]:
    """
    Update existing equipment.
    
    Args:
        equip_name: Name of the equipment to update
    
    Returns:
        JSON response with updated equipment data
        or error message if update fails
    """
    try:
        updated_equip = request.json
        if not updated_equip:
            return jsonify({"error": "Chybí data zařízení"}), 400
            
        conn = db_connect()
        c = conn.cursor()
        c.execute('''UPDATE equipment SET category=?, max_tests=?, sides=?, status=? WHERE name=?''', (
            updated_equip.get('category'),
            int(updated_equip.get('max_tests', DEFAULT_MAX_TESTS)),
            int(updated_equip.get('sides', DEFAULT_SIDES)),
            updated_equip.get('status', DEFAULT_EQUIPMENT_STATUS),
            equip_name
        ))
        conn.commit()
        conn.close()
        return jsonify(updated_equip)
    except Exception as e:
        return jsonify({"error": f"Chyba při aktualizaci zařízení: {str(e)}"}), 500

@equipment_bp.route('/api/equipment/<equip_name>', methods=['DELETE'])
def delete_equipment(equip_name: str) -> Tuple[dict, int]:
    """
    Delete equipment by name.
    
    Args:
        equip_name: Name of the equipment to delete
    
    Returns:
        JSON response with success status
        or error message if deletion fails
    """
    try:
        conn = db_connect()
        c = conn.cursor()
        c.execute('DELETE FROM equipment WHERE name=?', (equip_name,))
        conn.commit()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": f"Chyba při mazání zařízení: {str(e)}"}), 500
