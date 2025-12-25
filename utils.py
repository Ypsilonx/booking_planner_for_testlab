"""
Utility functions for booking validation and collision detection.

Functions:
- validate_booking_data: Validates booking data before saving
- check_collision: Checks if booking conflicts with existing bookings
- get_effective_capacity: Gets equipment capacity with temporary overrides
"""

import datetime
import sqlite3
from typing import Dict, List, Any, Tuple, Optional
from config import MAX_DESCRIPTION_LENGTH, DB_PATH

def validate_booking_data(booking_data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validate booking data before creating or updating.
    
    Args:
        booking_data: Dictionary containing booking information
        
    Returns:
        Tuple containing:
            - is_valid (bool): True if data is valid
            - error_message (str): Error description if invalid, empty string if valid
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
    if len(booking_data['description']) > MAX_DESCRIPTION_LENGTH:
        return False, f"Popis je příliš dlouhý (max {MAX_DESCRIPTION_LENGTH} znaků)"
    return True, ""


def get_effective_capacity(equipment_name: str, check_date: datetime.date) -> Optional[int]:
    """
    Get effective equipment capacity for a specific date.
    Checks for temporary capacity overrides first, then returns base capacity.
    
    Args:
        equipment_name: Name of the equipment
        check_date: Date to check capacity for
        
    Returns:
        int: Effective max_tests capacity, or None if equipment not found
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Check for capacity override for this date
        c.execute('''
            SELECT max_tests 
            FROM equipment_capacity_overrides
            WHERE equipment_name = ? 
            AND ? BETWEEN start_date AND end_date
            ORDER BY id DESC
            LIMIT 1
        ''', (equipment_name, check_date.isoformat()))
        
        override = c.fetchone()
        if override:
            conn.close()
            return override[0]
        
        # No override, get base capacity
        c.execute('SELECT max_tests FROM equipment WHERE name = ?', (equipment_name,))
        result = c.fetchone()
        conn.close()
        
        return result[0] if result else None
        
    except sqlite3.Error:
        return None


def check_collision(new_booking: Dict[str, Any], all_bookings: List[Dict[str, Any]], 
                   all_equipment: List[Dict[str, Any]]) -> bool:
    """
    Check if new booking collides with existing bookings.
    Now supports dynamic capacity overrides - checks each day individually.
    
    Collision occurs when:
    - Bookings overlap in time
    - Equipment capacity is exceeded (considering temporary overrides)
    - Blocker reservations don't count towards capacity
    
    Args:
        new_booking: New booking to check
        all_bookings: List of all existing bookings
        all_equipment: List of all equipment with capacities
        
    Returns:
        True if collision detected, False otherwise
    """
    try:
        equipment_id = new_booking['equipment_id']
        base_equipment_name = equipment_id.split(' - ')[0].strip()
        equipment_details = next((e for e in all_equipment if e['name'] == base_equipment_name), None)
        if not equipment_details:
            return True
        
        new_start = datetime.date.fromisoformat(new_booking['start_date'])
        new_end = datetime.date.fromisoformat(new_booking['end_date'])
    except (IndexError, KeyError, AttributeError, ValueError):
        return True
    
    # If new booking is blocker, it doesn't consume capacity
    is_new_blocker = new_booking.get('is_blocker', False)
    
    # Check each day in the booking period
    current_date = new_start
    while current_date <= new_end:
        # Get effective capacity for this specific date
        max_tests = get_effective_capacity(base_equipment_name, current_date)
        if max_tests is None:
            return True  # Equipment not found
        
        # Count overlapping bookings on this date
        overlapping_count = 0
        for booking in all_bookings:
            # Skip self when updating
            if 'id' in new_booking and new_booking['id'] == booking['id']:
                continue
            
            if booking['equipment_id'] == equipment_id:
                try:
                    existing_start = datetime.date.fromisoformat(booking['start_date'])
                    existing_end = datetime.date.fromisoformat(booking['end_date'])
                    
                    # Check if this booking overlaps current_date
                    if existing_start <= current_date <= existing_end:
                        # Blockers don't count towards capacity
                        if not booking.get('is_blocker', False):
                            overlapping_count += 1
                except ValueError:
                    continue
        
        # Check if capacity would be exceeded on this date
        if not is_new_blocker and overlapping_count >= max_tests:
            return True  # Collision detected
        
        current_date += datetime.timedelta(days=1)
    
    return False  # No collision
