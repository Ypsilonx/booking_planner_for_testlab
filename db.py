"""
Database module with improved transaction handling and connection management.

Features:
- Automatic transaction rollback on errors
- Connection pooling via context managers
- Structured error handling
- Logging support
"""

import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from contextlib import contextmanager
from config import DB_PATH

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@contextmanager
def get_db_connection():
    """
    Context manager for safe database connections with automatic cleanup.
    
    Yields:
        sqlite3.Connection: Database connection with row_factory set
        
    Example:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM bookings')
            conn.commit()  # Explicit commit required
    """
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        yield conn
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()


def db_connect():
    """
    Legacy function for backward compatibility.
    Returns raw sqlite3 connection.
    
    Note: Prefer using get_db_connection() context manager.
    """
    return sqlite3.connect(DB_PATH)


def load_bookings_db() -> List[Dict[str, Any]]:
    """
    Load all bookings from database with proper error handling.
    
    Returns:
        List[Dict]: List of booking dictionaries
        
    Raises:
        sqlite3.Error: If database query fails
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, description, tma_number, start_date, end_date, 
                       equipment_id, project_name, project_color, note, 
                       is_blocker, text_style 
                FROM bookings
                ORDER BY start_date
            ''')
            rows = cursor.fetchall()
            
            bookings = []
            for row in rows:
                # Parse text_style JSON
                text_style = row['text_style']
                if isinstance(text_style, str):
                    try:
                        text_style = json.loads(text_style)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON in text_style for booking {row['id']}")
                        text_style = {}
                
                bookings.append({
                    'id': row['id'],
                    'description': row['description'],
                    'tma_number': row['tma_number'],
                    'start_date': row['start_date'],
                    'end_date': row['end_date'],
                    'equipment_id': row['equipment_id'],
                    'project_name': row['project_name'],
                    'project_color': row['project_color'],
                    'note': row['note'],
                    'is_blocker': bool(row['is_blocker']),
                    'text_style': text_style
                })
            
            logger.info(f"Loaded {len(bookings)} bookings from database")
            return bookings
            
    except sqlite3.Error as e:
        logger.error(f"Failed to load bookings: {e}")
        raise


def load_equipment_db() -> List[Dict[str, Any]]:
    """
    Load all equipment from database.
    
    Returns:
        List[Dict]: List of equipment dictionaries
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT name, category, max_tests, status 
                FROM equipment
                ORDER BY name
            ''')
            rows = cursor.fetchall()
            
            equipment = []
            for row in rows:
                equipment.append({
                    'id': row['name'],  # Use name as id for compatibility
                    'name': row['name'],
                    'category': row['category'],
                    'max_tests': row['max_tests'],
                    'status': row['status']
                })
            
            logger.info(f"Loaded {len(equipment)} equipment items")
            return equipment
            
    except sqlite3.Error as e:
        logger.error(f"Failed to load equipment: {e}")
        raise


def load_projects_db() -> List[Dict[str, Any]]:
    """
    Load all projects from database.
    
    Returns:
        List[Dict]: List of project dictionaries
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT name, color, textColor, active 
                FROM projects
                ORDER BY name
            ''')
            rows = cursor.fetchall()
            
            projects = []
            for row in rows:
                projects.append({
                    'id': row['name'],  # Use name as id for compatibility
                    'name': row['name'],
                    'color': row['color'],
                    'text_color': row['textColor'],  # Convert to snake_case
                    'active': bool(row['active'])
                })
            
            logger.info(f"Loaded {len(projects)} projects")
            return projects
            
    except sqlite3.Error as e:
        logger.error(f"Failed to load projects: {e}")
        raise


def create_booking(booking_data: Dict[str, Any]) -> int:
    """
    Create new booking in database with transaction support.
    
    Args:
        booking_data: Dictionary with booking information
        
    Returns:
        int: ID of created booking
        
    Raises:
        sqlite3.Error: If insert fails
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get next ID
            cursor.execute('SELECT MAX(id) FROM bookings')
            max_id = cursor.fetchone()[0]
            new_id = (max_id or 100) + 1
            
            # Insert booking
            cursor.execute('''
                INSERT INTO bookings 
                (id, description, tma_number, start_date, end_date, equipment_id, 
                 project_name, project_color, note, is_blocker, text_style)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                new_id,
                booking_data.get('description'),
                booking_data.get('tma_number'),
                booking_data.get('start_date'),
                booking_data.get('end_date'),
                booking_data.get('equipment_id'),
                booking_data.get('project_name'),
                booking_data.get('project_color'),
                booking_data.get('note'),
                int(booking_data.get('is_blocker', False)),
                json.dumps(booking_data.get('text_style', {}))
            ))
            
            conn.commit()
            logger.info(f"Created booking {new_id}")
            return new_id
            
    except sqlite3.Error as e:
        logger.error(f"Failed to create booking: {e}")
        raise


def update_booking(booking_id: int, booking_data: Dict[str, Any]) -> bool:
    """
    Update existing booking in database.
    
    Args:
        booking_id: ID of booking to update
        booking_data: Dictionary with updated booking information
        
    Returns:
        bool: True if update successful
        
    Raises:
        sqlite3.Error: If update fails
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE bookings 
                SET description=?, tma_number=?, start_date=?, end_date=?, 
                    equipment_id=?, project_name=?, project_color=?, note=?, 
                    is_blocker=?, text_style=? 
                WHERE id=?
            ''', (
                booking_data.get('description'),
                booking_data.get('tma_number'),
                booking_data.get('start_date'),
                booking_data.get('end_date'),
                booking_data.get('equipment_id'),
                booking_data.get('project_name'),
                booking_data.get('project_color'),
                booking_data.get('note'),
                int(booking_data.get('is_blocker', False)),
                json.dumps(booking_data.get('text_style', {})),
                booking_id
            ))
            
            conn.commit()
            rows_affected = cursor.rowcount
            
            if rows_affected == 0:
                logger.warning(f"No booking found with id {booking_id}")
                return False
            
            logger.info(f"Updated booking {booking_id}")
            return True
            
    except sqlite3.Error as e:
        logger.error(f"Failed to update booking {booking_id}: {e}")
        raise


def delete_booking(booking_id: int) -> bool:
    """
    Delete booking from database.
    
    Args:
        booking_id: ID of booking to delete
        
    Returns:
        bool: True if deletion successful
        
    Raises:
        sqlite3.Error: If delete fails
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM bookings WHERE id=?', (booking_id,))
            conn.commit()
            
            rows_affected = cursor.rowcount
            if rows_affected == 0:
                logger.warning(f"No booking found with id {booking_id}")
                return False
            
            logger.info(f"Deleted booking {booking_id}")
            return True
            
    except sqlite3.Error as e:
        logger.error(f"Failed to delete booking {booking_id}: {e}")
        raise
