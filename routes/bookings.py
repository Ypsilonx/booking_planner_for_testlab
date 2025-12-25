"""
Improved Bookings API routes with robust error handling and validation.
"""

from flask import Blueprint, request, jsonify
import logging
from typing import Tuple
from db import (
    load_bookings_db, load_equipment_db, 
    create_booking, update_booking, delete_booking
)
from utils import validate_booking_data, check_collision

logger = logging.getLogger(__name__)
bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/api/bookings', methods=['POST'])
def create_booking_endpoint() -> Tuple[dict, int]:
    """
    Create new booking with full validation and collision detection.
    
    Returns:
        JSON response with created booking and 201 status on success
        JSON error response with appropriate status on failure
    """
    try:
        # Get and validate request data
        booking_data = request.get_json()
        if not booking_data:
            logger.warning("Empty booking data received")
            return jsonify({"error": "Chybí data rezervace"}), 400
        
        # Validate booking data
        is_valid, error_message = validate_booking_data(booking_data)
        if not is_valid:
            logger.warning(f"Invalid booking data: {error_message}")
            return jsonify({"error": error_message}), 400
        
        # Check for collisions
        all_bookings = load_bookings_db()
        all_equipment = load_equipment_db()
        
        if check_collision(booking_data, all_bookings, all_equipment):
            logger.warning(f"Booking collision detected for equipment {booking_data.get('equipment_id')}")
            return jsonify({"error": "Konflikt rezervací nebo překročena kapacita"}), 409
        
        # Create booking in database
        new_id = create_booking(booking_data)
        booking_data['id'] = new_id
        
        logger.info(f"Successfully created booking {new_id}")
        return jsonify(booking_data), 201
        
    except Exception as e:
        logger.error(f"Failed to create booking: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při vytváření rezervace: {str(e)}"}), 500


@bookings_bp.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking_endpoint(booking_id: int) -> Tuple[dict, int]:
    """
    Update existing booking with validation and collision detection.
    
    Args:
        booking_id: ID of booking to update
        
    Returns:
        JSON response with updated booking on success
        JSON error response on failure
    """
    try:
        # Get and validate request data
        booking_data = request.get_json()
        if not booking_data:
            logger.warning(f"Empty update data for booking {booking_id}")
            return jsonify({"error": "Chybí data rezervace"}), 400
        
        # Validate booking data
        is_valid, error_message = validate_booking_data(booking_data)
        if not is_valid:
            logger.warning(f"Invalid update data for booking {booking_id}: {error_message}")
            return jsonify({"error": error_message}), 400
        
        # Check for collisions (exclude current booking)
        booking_data['id'] = booking_id
        all_bookings = load_bookings_db()
        all_equipment = load_equipment_db()
        
        if check_collision(booking_data, all_bookings, all_equipment):
            logger.warning(f"Collision detected while updating booking {booking_id}")
            return jsonify({"error": "Konflikt rezervací nebo překročena kapacita"}), 409
        
        # Update booking in database
        success = update_booking(booking_id, booking_data)
        
        if not success:
            logger.warning(f"Booking {booking_id} not found for update")
            return jsonify({"error": "Rezervace nenalezena"}), 404
        
        logger.info(f"Successfully updated booking {booking_id}")
        return jsonify(booking_data), 200
        
    except Exception as e:
        logger.error(f"Failed to update booking {booking_id}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při aktualizaci rezervace: {str(e)}"}), 500


@bookings_bp.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking_endpoint(booking_id: int) -> Tuple[dict, int]:
    """
    Delete booking by ID.
    
    Args:
        booking_id: ID of booking to delete
        
    Returns:
        JSON success response on successful deletion
        JSON error response on failure
    """
    try:
        success = delete_booking(booking_id)
        
        if not success:
            logger.warning(f"Booking {booking_id} not found for deletion")
            return jsonify({"error": "Rezervace nenalezena"}), 404
        
        logger.info(f"Successfully deleted booking {booking_id}")
        return jsonify({"success": True, "id": booking_id}), 200
        
    except Exception as e:
        logger.error(f"Failed to delete booking {booking_id}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Chyba při mazání rezervace: {str(e)}"}), 500
