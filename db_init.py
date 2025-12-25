"""Database initialization and migration script.

Migrates data from legacy JSON files to SQLite database.
Creates necessary tables if they don't exist.

Usage:
    python db_init.py
"""

import sqlite3
import json
import os
import re
from typing import Optional
from config import (
    DB_PATH,
    LEGACY_BOOKINGS_FILE,
    LEGACY_EQUIPMENT_FILE,
    LEGACY_PROJECTS_FILE,
    TMA_REGEX_PATTERN
)

def create_tables(conn: sqlite3.Connection) -> None:
    """
    Create database tables if they don't exist.
    
    Args:
        conn: SQLite database connection
    """
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

def migrate_bookings(conn: sqlite3.Connection) -> None:
    """
    Migrate bookings from legacy JSON file to database.
    Extracts TMA numbers from descriptions during migration.
    
    Args:
        conn: SQLite database connection
    """
    if not os.path.exists(LEGACY_BOOKINGS_FILE):
        print(f'Soubor {LEGACY_BOOKINGS_FILE} neexistuje, přeskočuji migraci bookings.')
        return
        
    if os.path.exists(LEGACY_BOOKINGS_FILE):
        c = conn.cursor()
        with open(LEGACY_BOOKINGS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        bookings = data.get('bookings', [])
        for b in bookings:
            description = b.get('description', '')
            tma_match = re.search(TMA_REGEX_PATTERN, description)
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

def migrate_equipment(conn: sqlite3.Connection) -> None:
    """
    Migrate equipment from legacy JSON file to database.
    
    Args:
        conn: SQLite database connection
    """
    if not os.path.exists(LEGACY_EQUIPMENT_FILE):
        print(f'Soubor {LEGACY_EQUIPMENT_FILE} neexistuje, přeskočuji migraci equipment.')
        return
        
    with open(LEGACY_EQUIPMENT_FILE, 'r', encoding='utf-8') as f:
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

def migrate_projects(conn: sqlite3.Connection) -> None:
    """
    Migrate projects from legacy JSON file to database.
    
    Args:
        conn: SQLite database connection
    """
    if not os.path.exists(LEGACY_PROJECTS_FILE):
        print(f'Soubor {LEGACY_PROJECTS_FILE} neexistuje, přeskočuji migraci projects.')
        return
        
    if os.path.exists(LEGACY_PROJECTS_FILE):
        with open(LEGACY_PROJECTS_FILE, 'r', encoding='utf-8') as f:
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

def main() -> None:
    """
    Main migration function.
    Creates tables and migrates data from legacy JSON files.
    """
    try:
        print('Zahájení migrace dat do SQLite...')
        conn = sqlite3.connect(DB_PATH)
        create_tables(conn)
        migrate_bookings(conn)
        migrate_equipment(conn)
        migrate_projects(conn)
        conn.close()
        print('Migrace dat do SQLite dokončena.')
    except Exception as e:
        print(f'Chyba při migraci: {str(e)}')
        raise

if __name__ == '__main__':
    main()
