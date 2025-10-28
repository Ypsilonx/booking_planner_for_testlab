"""
Database utility functions for Booking Planner.

Provides functions for:
- Database connection management
- Loading data from SQLite tables
- TMA number extraction from descriptions
"""

import sqlite3
import json

DB_PATH = 'booking_planner.db'

def db_connect():
    """
    Create and return SQLite database connection.
    
    Returns:
        sqlite3.Connection: Database connection object
    """
    return sqlite3.connect(DB_PATH)

def load_bookings_db():
    """
    Load all bookings from database.
    
    Returns:
        list: List of booking dictionaries with all fields including TMA numbers
    """
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT id, description, tma_number, start_date, end_date, equipment_id, project_name, project_color, note, is_blocker, text_style FROM bookings')
    rows = c.fetchall()
    bookings = []
    for row in rows:
        # Parsuj text_style pokud je string, jinak použij prázdný dict
        text_style = row[10]
        if isinstance(text_style, str):
            try:
                text_style = json.loads(text_style)
            except:
                text_style = {}
        bookings.append({
            'id': row[0],
            'description': row[1],
            'tma_number': row[2],
            'start_date': row[3],
            'end_date': row[4],
            'equipment_id': row[5],
            'project_name': row[6],
            'project_color': row[7],
            'note': row[8],
            'is_blocker': bool(row[9]),
            'text_style': text_style
        })
    conn.close()
    return bookings

def extract_tma_from_description(description):
    """
    Extract TMA number from description text.
    
    TMA format: EU-SVA-XXXXXX-YY (e.g., EU-SVA-123456-25)
    
    Args:
        description (str): Description text potentially containing TMA number
        
    Returns:
        tuple: (tma_number: str|None, clean_description: str)
    """
    import re
    tma_regex = r"EU-SVA-\d{6}-\d{2}"
    tma_match = re.search(tma_regex, description)
    if tma_match:
        tma_number = tma_match.group(0)
        clean_description = description.replace(tma_number, '').strip()
        # Odstraň případné dvojité mezery a pomlčky na začátku
        clean_description = re.sub(r'^[-\s]+', '', clean_description)
        return tma_number, clean_description
    return None, description

def load_equipment_db():
    """
    Load all equipment from database.
    
    Returns:
        list: List of equipment dictionaries with name, category, capacity, etc.
    """
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT name, category, max_tests, sides, status FROM equipment')
    rows = c.fetchall()
    equipment = []
    for row in rows:
        equipment.append({
            'name': row[0],
            'category': row[1],
            'max_tests': row[2],
            'sides': row[3],
            'status': row[4]
        })
    conn.close()
    return equipment

def load_projects_db():
    """
    Load all projects from database.
    
    Returns:
        list: List of project dictionaries with name, color, status, etc.
    """
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT name, color, textColor, active FROM projects')
    rows = c.fetchall()
    projects = []
    for row in rows:
        projects.append({
            'name': row[0],
            'color': row[1],
            'textColor': row[2],
            'active': bool(row[3])
        })
    conn.close()
    return projects
