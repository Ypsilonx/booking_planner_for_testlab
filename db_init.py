import sqlite3
import json
import os

DB_PATH = 'booking_planner.db'
BOOKINGS_FILE = 'bookings_data.json'
EQUIPMENT_FILE = 'equipment.json'
PROJECTS_FILE = 'projects.json'

def create_tables(conn):
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY,
        description TEXT,
        tma_number TEXT,
        start_date TEXT,
        end_date TEXT,
        equipment_id TEXT,
        project_name TEXT,
        project_color TEXT,
        note TEXT,
        is_blocker INTEGER,
        text_style TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS equipment (
        name TEXT PRIMARY KEY,
        category TEXT,
        max_tests INTEGER,
        sides INTEGER,
        status TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS projects (
        name TEXT PRIMARY KEY,
        color TEXT,
        textColor TEXT,
        active INTEGER
    )''')
    conn.commit()

def migrate_bookings(conn):
    import re
    tma_regex = r"EU-SVA-\d{6}-\d{2}"
    if os.path.exists(BOOKINGS_FILE):
        c = conn.cursor()
        with open(BOOKINGS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        bookings = data.get('bookings', [])
        for b in bookings:
            description = b.get('description', '')
            tma_match = re.search(tma_regex, description)
            tma_number = tma_match.group(0) if tma_match else None
            # Odstraň TMA číslo z description
            if tma_number:
                description = description.replace(tma_number, '').strip()
            else:
                print(f"VAROVÁNÍ: TMA číslo nebylo nalezeno v booking id {b.get('id')}, description: '{description}'")
            c.execute(
                '''INSERT OR REPLACE INTO bookings (id, description, tma_number, start_date, end_date, equipment_id, project_name, project_color, note, is_blocker, text_style)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (
                    b.get('id'),
                    description,
                    tma_number,
                    b.get('start_date'),
                    b.get('end_date'),
                    b.get('equipment_id'),
                    b.get('project_name'),
                    b.get('project_color'),
                    b.get('note'),
                    int(b.get('is_blocker', False)),
                    json.dumps(b.get('text_style', {}))
                )
            )
        conn.commit()

def migrate_equipment(conn):
    if not os.path.exists(EQUIPMENT_FILE):
        return
    with open(EQUIPMENT_FILE, 'r', encoding='utf-8') as f:
        equipment = json.load(f)
    c = conn.cursor()
    for e in equipment:
        c.execute('''INSERT OR REPLACE INTO equipment (name, category, max_tests, sides, status)
            VALUES (?, ?, ?, ?, ?)''', (
            e.get('name'),
            e.get('category'),
            e.get('max_tests'),
            e.get('sides'),
            e.get('status')
        ))
    conn.commit()

def migrate_projects(conn):
    if not os.path.exists(PROJECTS_FILE):
        return
    with open(PROJECTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    projects = data.get('projects', [])
    c = conn.cursor()
    for p in projects:
        c.execute('''INSERT OR REPLACE INTO projects (name, color, textColor, active)
            VALUES (?, ?, ?, ?)''', (
            p.get('name'),
            p.get('color'),
            p.get('textColor'),
            int(p.get('active', True))
        ))
    conn.commit()

def main():
    conn = sqlite3.connect(DB_PATH)
    create_tables(conn)
    migrate_bookings(conn)
    migrate_equipment(conn)
    migrate_projects(conn)
    conn.close()
    print('Migrace dat do SQLite dokončena.')

if __name__ == '__main__':
    main()
