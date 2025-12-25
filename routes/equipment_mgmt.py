"""
Equipment management API routes.

Handles:
- GET /api/equipment - List all equipment
- POST /api/equipment - Create new equipment
- PUT /api/equipment/<name> - Update equipment
- DELETE /api/equipment/<name> - Delete equipment
- GET /api/equipment/<name>/capacity-overrides - Get capacity overrides
- POST /api/equipment/<name>/capacity-overrides - Add capacity override
- DELETE /api/equipment/capacity-overrides/<id> - Delete capacity override
"""

from flask import Blueprint, request, jsonify
import logging
import sqlite3
from typing import Tuple
from db import get_db_connection, load_equipment_db

logger = logging.getLogger(__name__)
equipment_mgmt_bp = Blueprint('equipment_mgmt', __name__)


@equipment_mgmt_bp.route('/api/equipment/capacity-overrides', methods=['GET'])
def get_all_capacity_overrides() -> Tuple[dict, int]:
    """Get all capacity overrides for all equipment."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, equipment_name, start_date, end_date, max_tests, reason
                FROM equipment_capacity_overrides
                ORDER BY equipment_name, start_date
            ''')
            rows = cursor.fetchall()
            
            overrides = []
            for row in rows:
                overrides.append({
                    'id': row['id'],
                    'equipment_name': row['equipment_name'],
                    'start_date': row['start_date'],
                    'end_date': row['end_date'],
                    'max_tests': row['max_tests'],
                    'reason': row['reason']
                })
            
            return jsonify(overrides), 200
            
    except Exception as e:
        logger.error(f"Failed to get capacity overrides: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při načítání přepisů kapacity: {str(e)}"}), 500


@equipment_mgmt_bp.route('/api/equipment/<equipment_name>/capacity-overrides', methods=['POST'])
def add_capacity_override(equipment_name: str) -> Tuple[dict, int]:
    """
    Add temporary capacity override for equipment.
    
    Expected JSON:
        - start_date: str (ISO format)
        - end_date: str (ISO format)
        - max_tests: int
        - reason: str (optional)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Chybí data"}), 400
        
        required_fields = ['start_date', 'end_date', 'max_tests']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Chybí pole: {field}"}), 400
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO equipment_capacity_overrides 
                (equipment_name, start_date, end_date, max_tests, reason)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                equipment_name,
                data['start_date'],
                data['end_date'],
                data['max_tests'],
                data.get('reason', '')
            ))
            conn.commit()
            
            override_id = cursor.lastrowid
            
            logger.info(f"Added capacity override for {equipment_name}: {data['max_tests']} tests from {data['start_date']} to {data['end_date']}")
            
            return jsonify({
                'id': override_id,
                'equipment_name': equipment_name,
                **data
            }), 201
            
    except Exception as e:
        logger.error(f"Failed to add capacity override: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při přidání přepisu kapacity: {str(e)}"}), 500


@equipment_mgmt_bp.route('/api/equipment/capacity-overrides/<int:override_id>', methods=['DELETE'])
def delete_capacity_override(override_id: int) -> Tuple[dict, int]:
    """Delete capacity override by ID."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM equipment_capacity_overrides WHERE id = ?', (override_id,))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Přepis kapacity nenalezen"}), 404
            
            logger.info(f"Deleted capacity override {override_id}")
            return jsonify({"success": True, "id": override_id}), 200
            
    except Exception as e:
        logger.error(f"Failed to delete capacity override: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při mazání přepisu kapacity: {str(e)}"}), 500


@equipment_mgmt_bp.route('/api/equipment', methods=['POST'])
def create_equipment() -> Tuple[dict, int]:
    """
    Create new equipment.
    
    Expected JSON:
        - name: str (unique)
        - category: str
        - max_tests: int
        - status: str (default: 'active')
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Chybí data"}), 400
        
        required_fields = ['name', 'category', 'max_tests']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Chybí pole: {field}"}), 400
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO equipment (name, category, max_tests, status)
                VALUES (?, ?, ?, ?)
            ''', (
                data['name'],
                data['category'],
                data['max_tests'],
                data.get('status', 'active')
            ))
            conn.commit()
            
            logger.info(f"Created equipment: {data['name']}")
            return jsonify(data), 201
            
    except sqlite3.IntegrityError:
        return jsonify({"error": "Zařízení s tímto názvem již existuje"}), 409
    except Exception as e:
        logger.error(f"Failed to create equipment: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při vytváření zařízení: {str(e)}"}), 500


@equipment_mgmt_bp.route('/api/equipment/<equipment_name>', methods=['PUT'])
def update_equipment(equipment_name: str) -> Tuple[dict, int]:
    """Update existing equipment."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Chybí data"}), 400
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE equipment 
                SET category = ?, max_tests = ?, status = ?
                WHERE name = ?
            ''', (
                data.get('category'),
                data.get('max_tests'),
                data.get('status', 'active'),
                equipment_name
            ))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Zařízení nenalezeno"}), 404
            
            logger.info(f"Updated equipment: {equipment_name}")
            return jsonify({"name": equipment_name, **data}), 200
            
    except Exception as e:
        logger.error(f"Failed to update equipment: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při aktualizaci zařízení: {str(e)}"}), 500


@equipment_mgmt_bp.route('/api/equipment/<equipment_name>', methods=['DELETE'])
def delete_equipment(equipment_name: str) -> Tuple[dict, int]:
    """Delete equipment and all associated capacity overrides."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Delete capacity overrides first
            cursor.execute('DELETE FROM equipment_capacity_overrides WHERE equipment_name = ?', (equipment_name,))
            
            # Delete equipment
            cursor.execute('DELETE FROM equipment WHERE name = ?', (equipment_name,))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Zařízení nenalezeno"}), 404
            
            logger.info(f"Deleted equipment: {equipment_name}")
            return jsonify({"success": True, "name": equipment_name}), 200
            
    except Exception as e:
        logger.error(f"Failed to delete equipment: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při mazání zařízení: {str(e)}"}), 500
