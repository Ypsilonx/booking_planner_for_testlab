"""
Add equipment capacity overrides table for temporary capacity changes.
"""

import sqlite3
from config import DB_PATH

def add_capacity_overrides_table():
    """Add table for managing temporary equipment capacity changes."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create capacity overrides table
    c.execute('''
        CREATE TABLE IF NOT EXISTS equipment_capacity_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            max_tests INTEGER NOT NULL,
            reason TEXT,
            FOREIGN KEY (equipment_name) REFERENCES equipment(name)
        )
    ''')
    
    # Add index for faster queries
    c.execute('''
        CREATE INDEX IF NOT EXISTS idx_capacity_overrides_equipment 
        ON equipment_capacity_overrides(equipment_name)
    ''')
    
    c.execute('''
        CREATE INDEX IF NOT EXISTS idx_capacity_overrides_dates 
        ON equipment_capacity_overrides(start_date, end_date)
    ''')
    
    conn.commit()
    conn.close()
    
    print("✅ Tabulka equipment_capacity_overrides vytvořena")
    print("   - Umožňuje dočasně změnit kapacitu zařízení")
    print("   - Např. EKV-2000: normálně 2 testy, ale 1.1-31.3: 3 testy")

if __name__ == '__main__':
    add_capacity_overrides_table()
