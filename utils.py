"""
Utility functions for booking validation and collision detection.

Functions:
- validate_booking_data: Validates booking data before saving
- check_collision: Checks if booking conflicts with existing bookings
"""

import datetime
import json

def validate_booking_data(booking_data):
    """
    Validate booking data before creating or updating.
    
    Args:
        booking_data (dict): Dictionary containing booking information
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    required_fields = ['equipment_id', 'start_date', 'end_date', 'description']
    for field in required_fields:
        if field not in booking_data or not booking_data[field]:
            return False, f"Chybí povinné pole: {field}"
    try:
        start_date = datetime.date.fromisoformat(booking_data['start_date'])
        end_date = datetime.date.fromisoformat(booking_data['end_date'])
        if end_date < start_date:
            return False, "Datum konce nemůže být před datem začátku"
    except ValueError:
        return False, "Neplatný formát data"
    if len(booking_data['description']) > 200:
        return False, "Popis je příliš dlouhý (max 200 znaků)"
    return True, ""

def check_collision(new_booking, all_bookings, all_equipment):
    """
    Check if new booking collides with existing bookings.
    
    Collision occurs when:
    - Bookings overlap in time
    - Equipment capacity is exceeded
    - Blocker reservations don't count towards capacity
    
    Args:
        new_booking (dict): New booking to check
        all_bookings (list): List of all existing bookings
        all_equipment (list): List of all equipment with capacities
        
    Returns:
        bool: True if collision detected, False otherwise
    """
    try:
        equipment_id = new_booking['equipment_id']
        base_equipment_name = equipment_id.split(' - ')[0].strip()
        equipment_details = next((e for e in all_equipment if e['name'] == base_equipment_name), None)
        if not equipment_details:
            return True
        max_tests = equipment_details.get('max_tests', 1)
        target_equipment_ids = [equipment_id]
    except (IndexError, KeyError, AttributeError):
        return True
    overlapping_count = 0
    try:
        new_start = datetime.date.fromisoformat(new_booking['start_date'])
        new_end = datetime.date.fromisoformat(new_booking['end_date'])
    except ValueError:
        return True
    for booking in all_bookings:
        if 'id' in new_booking and new_booking['id'] == booking['id']:
            continue
        if booking['equipment_id'] == equipment_id:
            is_new_booking_blocker = new_booking.get('is_blocker', False)
            is_existing_booking_blocker = booking.get('is_blocker', False)
            if is_new_booking_blocker and is_existing_booking_blocker:
                continue
            try:
                existing_start = datetime.date.fromisoformat(booking['start_date'])
                existing_end = datetime.date.fromisoformat(booking['end_date'])
                if max(new_start, existing_start) <= min(new_end, existing_end):
                    overlapping_count += 1
            except ValueError:
                continue
    if new_booking.get('is_blocker', False):
        return False
    return overlapping_count >= max_tests
