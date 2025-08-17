# --- Utility funkce pro práci s databází ---
import sqlite3
import json

DB_PATH = 'booking_planner.db'

def db_connect():
    return sqlite3.connect(DB_PATH)

def load_bookings_db():
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT id, description, start_date, end_date, equipment_id, project_name, project_color, note, is_blocker, text_style FROM bookings')
    rows = c.fetchall()
    bookings = []
    for row in rows:
        bookings.append({
            'id': row[0],
            'description': row[1],
            'start_date': row[2],
            'end_date': row[3],
            'equipment_id': row[4],
            'project_name': row[5],
            'project_color': row[6],
            'note': row[7],
            'is_blocker': bool(row[8]),
            'text_style': json.loads(row[9]) if row[9] else {}
        })
    conn.close()
    return bookings

def load_equipment_db():
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
import sqlite3

def db_connect():
    return sqlite3.connect('booking_planner.db')

def load_equipment_db():
    conn = db_connect()
    c = conn.cursor()
    c.execute('SELECT name, category, max_tests, sides, status FROM equipment')
    equipment = [dict(zip(['name', 'category', 'max_tests', 'sides', 'status'], row)) for row in c.fetchall()]
    conn.close()
    return equipment
# ...další utility funkce dle potřeby...
