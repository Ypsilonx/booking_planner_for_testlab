"""Equipment API routes.

Handles read access to equipment:
- GET /api/equipment - Get all equipment

Zápisové operace (POST/PUT/DELETE) jsou v routes/equipment_mgmt.py -
nekombinuj je zpět sem, ať nevznikne duplicitní route jako předtím.
"""

from flask import Blueprint, jsonify
from typing import Tuple
from db import load_equipment_db

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
