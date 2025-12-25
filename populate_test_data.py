"""
Script to populate database with sample test data.
"""

import sqlite3
from config import DB_PATH

def populate_sample_data():
    """Add sample equipment and projects to database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Sample equipment
    equipment_data = [
        ('EKV-2000', 'Klimatická komora', 2, 'active'),
        ('EKV-3000', 'Klimatická komora', 3, 'active'),
        ('VTS-100', 'Vibrační stůl', 1, 'active'),
        ('VTS-200', 'Vibrační stůl', 2, 'active'),
    ]
    
    print("Přidávám testovací zařízení...")
    for name, category, max_tests, status in equipment_data:
        try:
            c.execute('''
                INSERT OR REPLACE INTO equipment (name, category, max_tests, status)
                VALUES (?, ?, ?, ?)
            ''', (name, category, max_tests, status))
            print(f"  ✓ {name}")
        except sqlite3.Error as e:
            print(f"  ✗ {name}: {e}")
    
    # Sample projects
    projects_data = [
        ('Project A', '#FF5733', '#FFFFFF', 1),
        ('Project B', '#33C3FF', '#000000', 1),
        ('Project C', '#75FF33', '#000000', 1),
        ('Test XYZ', '#FFD700', '#000000', 1),
    ]
    
    print("\nPřidávám testovací projekty...")
    for name, color, text_color, active in projects_data:
        try:
            c.execute('''
                INSERT OR REPLACE INTO projects (name, color, textColor, active)
                VALUES (?, ?, ?, ?)
            ''', (name, color, text_color, active))
            print(f"  ✓ {name}")
        except sqlite3.Error as e:
            print(f"  ✗ {name}: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Testovací data úspěšně přidána!")
    print(f"   Zařízení: {len(equipment_data)}")
    print(f"   Projekty: {len(projects_data)}")

if __name__ == '__main__':
    populate_sample_data()
