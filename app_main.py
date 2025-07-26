# -*- coding: utf-8 -*-
# --- Rezervační systém ve Flask v4.2 (Zjednodušená struktura zařízení) ---

from flask import Flask, jsonify, render_template, request
import datetime
import json

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

BOOKINGS_FILE = 'bookings_data.json'
EQUIPMENT_FILE = 'equipment.json'
PROJECTS_FILE = 'projects.json'

def load_equipment():
    """Načte seznam zařízení z externího JSON souboru."""
    try:
        with open(EQUIPMENT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"VAROVÁNÍ: Soubor '{EQUIPMENT_FILE}' nebyl nalezen nebo je neplatný.")
        return []

def load_projects():
    """Načte seznam projektů z externího JSON souboru."""
    try:
        with open(PROJECTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"VAROVÁNÍ: Soubor '{PROJECTS_FILE}' nebyl nalezen nebo je neplatný.")
        return {"projects": []}

def save_projects(data):
    """Uloží data o projektech do JSON souboru."""
    with open(PROJECTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def load_bookings():
    """Načte rezervace ze souboru."""
    try:
        with open(BOOKINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"bookings": [], "next_booking_id": 101}

def save_bookings(data):
    """Uloží data o rezervacích do JSON souboru."""
    with open(BOOKINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def validate_booking_data(booking_data):
    """Validuje data nové/upravované rezervace."""
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
    
    # Kontrola délky description
    if len(booking_data['description']) > 200:
        return False, "Popis je příliš dlouhý (max 200 znaků)"
    
    return True, ""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_all_data():
    """API endpoint, který vrací všechna data (zařízení, rezervace a projekty)."""
    equipment = load_equipment()
    bookings_data = load_bookings()
    projects_data = load_projects()
    return jsonify({
        "equipment": equipment,
        "bookings": bookings_data.get("bookings", []),
        "projects": projects_data.get("projects", [])
    })

def check_collision(new_booking, all_bookings, all_equipment):
    """
    Zkontroluje, zda nová rezervace nepřekračuje maximální kapacitu zařízení.
    Vylepšená verze s lepší podporou pro speciální případy.
    """
    try:
        equipment_id = new_booking['equipment_id']
        base_equipment_name = equipment_id.split(' - ')[0].strip()
        
        # Najdi zařízení v konfiguraci
        equipment_details = next((e for e in all_equipment if e['name'] == base_equipment_name), None)
        if not equipment_details:
            print(f"VAROVÁNÍ: Neznámé zařízení '{base_equipment_name}'")
            return True  # Chyba - neznámé zařízení

        # POZOR: Tady použijeme max_tests z JSON jako fallback
        # V budoucnu by mělo přijít custom nastavení z frontendu
        max_tests = equipment_details.get('max_tests', 1)
        
        # Určí jaká equipment_id kontrolovat pro kolize
        target_equipment_ids = [equipment_id]  # Default: kontroluj pouze stejný prostor
        
    except (IndexError, KeyError, AttributeError) as e:
        print(f"CHYBA při parsování equipment_id: {e}")
        return True
    
    # Spočítej překrývající se rezervace pro konkrétní equipment_id
    overlapping_count = 0
    
    try:
        new_start = datetime.date.fromisoformat(new_booking['start_date'])
        new_end = datetime.date.fromisoformat(new_booking['end_date'])
    except ValueError as e:
        print(f"CHYBA při parsování datumů: {e}")
        return True

    for booking in all_bookings:
        # Přeskoč editovanou rezervaci
        if 'id' in new_booking and new_booking['id'] == booking['id']:
            continue
            
        # Kontroluj pouze pro STEJNÉ equipment_id (ne celé zařízení)
        if booking['equipment_id'] == equipment_id:
            # JEDNODUCHÁ LOGIKA PRO BLOCKERY:
            # Pokud vytváříme BLOCKER → ignoruj všechny existující blockery (blockery neblokují kapacitu)
            
            is_new_booking_blocker = new_booking.get('is_blocker', False)
            is_existing_booking_blocker = booking.get('is_blocker', False)
            is_editing = 'id' in new_booking
            
            print(f"DEBUG collision check: new_blocker={is_new_booking_blocker}, existing_blocker={is_existing_booking_blocker}, is_editing={is_editing}")
            
            # Pokud vytváříme/editujeme BLOCKER → ignoruj všechny existující blockery 
            if is_new_booking_blocker and is_existing_booking_blocker:
                print(f"DEBUG: Ignoring blocker booking {booking.get('id', 'unknown')} (new=blocker ignores existing blocker)")
                continue
                    
            try:
                existing_start = datetime.date.fromisoformat(booking['start_date'])
                existing_end = datetime.date.fromisoformat(booking['end_date'])
                
                # Kontrola překryvu
                if max(new_start, existing_start) <= min(new_end, existing_end):
                    overlapping_count += 1
                    print(f"DEBUG: Found overlap with booking {booking.get('id', 'unknown')} (blocker={is_existing_booking_blocker})")
            except ValueError:
                print(f"VAROVÁNÍ: Neplatná data v rezervaci {booking.get('id', 'unknown')}")
                continue  # Přeskoč neplatná data

    print(f"DEBUG: {equipment_id} má {overlapping_count} překrývajících rezervací, max_tests={max_tests}")
    
    # DŮLEŽITÉ: Pokud vytváříme/editujeme BLOCKER → NIKDY neblokuj kapacitu!
    if new_booking.get('is_blocker', False):
        print(f"DEBUG: Blocker booking - ignoring capacity check")
        return False  # Blocker nikdy neblokuje kapacitu
    
    return overlapping_count >= max_tests

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    new_booking_data = request.json
    
    # Validace vstupních dat
    is_valid, error_message = validate_booking_data(new_booking_data)
    if not is_valid:
        return jsonify({"error": error_message}), 400
    
    bookings_data = load_bookings()
    all_equipment = load_equipment()
    
    # Získej custom kapacity z frontendu pokud jsou poskytnuty
    custom_capacities = new_booking_data.get('custom_capacities', {})
    if custom_capacities:
        # Aktualizuj max_tests podle custom nastavení
        equipment_id = new_booking_data['equipment_id']
        if equipment_id in custom_capacities:
            # Najdi odpovídající zařízení a aktualizuj jeho kapacitu
            base_name = equipment_id.split(' - ')[0].strip()
            for equip in all_equipment:
                if equip['name'] == base_name:
                    equip['max_tests'] = custom_capacities[equipment_id]
                    break
    
    if check_collision(new_booking_data, bookings_data['bookings'], all_equipment):
        return jsonify({"error": "Booking collision detected or capacity exceeded"}), 409
        
    new_id = bookings_data.get('next_booking_id', 101)
    new_booking_data['id'] = new_id
    
    # Odstranit custom_capacities před uložením
    booking_to_save = {k: v for k, v in new_booking_data.items() if k != 'custom_capacities'}
    bookings_data['bookings'].append(booking_to_save)
    bookings_data['next_booking_id'] = new_id + 1
    
    try:
        save_bookings(bookings_data)
        return jsonify(booking_to_save), 201
    except Exception as e:
        print(f"CHYBA při ukládání rezervace: {e}")
        return jsonify({"error": "Chyba při ukládání rezervace"}), 500

@app.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    updated_booking_data = request.json
    
    # Validace vstupních dat
    is_valid, error_message = validate_booking_data(updated_booking_data)
    if not is_valid:
        return jsonify({"error": error_message}), 400
    
    bookings_data = load_bookings()
    all_equipment = load_equipment()

    updated_booking_data['id'] = booking_id
    
    # Získej custom kapacity z frontendu pokud jsou poskytnuty
    custom_capacities = updated_booking_data.get('custom_capacities', {})
    if custom_capacities:
        # Aktualizuj max_tests podle custom nastavení
        equipment_id = updated_booking_data['equipment_id']
        if equipment_id in custom_capacities:
            # Najdi odpovídající zařízení a aktualizuj jeho kapacitu
            base_name = equipment_id.split(' - ')[0].strip()
            for equip in all_equipment:
                if equip['name'] == base_name:
                    equip['max_tests'] = custom_capacities[equipment_id]
                    break

    if check_collision(updated_booking_data, bookings_data['bookings'], all_equipment):
        return jsonify({"error": "Booking collision detected or capacity exceeded"}), 409

    booking_index = next((i for i, b in enumerate(bookings_data['bookings']) if b['id'] == booking_id), None)
    
    if booking_index is not None:
        # Odstranit custom_capacities před uložením
        booking_to_save = {k: v for k, v in updated_booking_data.items() if k != 'custom_capacities'}
        bookings_data['bookings'][booking_index] = booking_to_save
        try:
            save_bookings(bookings_data)
            return jsonify(booking_to_save)
        except Exception as e:
            print(f"CHYBA při aktualizaci rezervace: {e}")
            return jsonify({"error": "Chyba při ukládání aktualizace"}), 500
    
    return jsonify({"error": "Booking not found"}), 404

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    data = load_bookings()
    original_length = len(data['bookings'])
    data['bookings'] = [b for b in data['bookings'] if b['id'] != booking_id]
    
    if len(data['bookings']) < original_length:
        save_bookings(data)
        return jsonify({"success": True}), 200
        
    return jsonify({"error": "Booking not found"}), 404

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Vrátí seznam všech projektů."""
    projects_data = load_projects()
    return jsonify(projects_data)

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Vytvoří nový projekt."""
    new_project = request.json
    
    # Validace
    if not new_project.get('name') or not new_project.get('color'):
        return jsonify({"error": "Chybí název nebo barva projektu"}), 400
    
    projects_data = load_projects()
    
    # Kontrola duplicity názvu
    existing_names = [p['name'] for p in projects_data['projects']]
    if new_project['name'] in existing_names:
        return jsonify({"error": "Projekt s tímto názvem již existuje"}), 409
    
    # Přidání defaultních hodnot
    new_project['active'] = new_project.get('active', True)
    new_project['textColor'] = new_project.get('textColor', '#ffffff')
    
    projects_data['projects'].append(new_project)
    
    try:
        save_projects(projects_data)
        return jsonify(new_project), 201
    except Exception as e:
        print(f"CHYBA při ukládání projektu: {e}")
        return jsonify({"error": "Chyba při ukládání projektu"}), 500

@app.route('/api/projects/<project_name>', methods=['PUT'])
def update_project(project_name):
    """Aktualizuje existující projekt."""
    updated_project = request.json
    projects_data = load_projects()
    
    # Najdi projekt podle názvu
    project_index = None
    for i, project in enumerate(projects_data['projects']):
        if project['name'] == project_name:
            project_index = i
            break
    
    if project_index is not None:
        # Zachovej původní název pokud není uveden nový
        if 'name' not in updated_project:
            updated_project['name'] = project_name
            
        projects_data['projects'][project_index] = {**projects_data['projects'][project_index], **updated_project}
        
        try:
            save_projects(projects_data)
            return jsonify(projects_data['projects'][project_index])
        except Exception as e:
            print(f"CHYBA při aktualizaci projektu: {e}")
            return jsonify({"error": "Chyba při ukládání aktualizace projektu"}), 500
    
    return jsonify({"error": "Projekt nebyl nalezen"}), 404

@app.route('/api/projects/<project_name>', methods=['DELETE'])
def delete_project(project_name):
    """Smaže projekt."""
    projects_data = load_projects()
    original_length = len(projects_data['projects'])
    
    projects_data['projects'] = [p for p in projects_data['projects'] if p['name'] != project_name]
    
    if len(projects_data['projects']) < original_length:
        try:
            save_projects(projects_data)
            return jsonify({"success": True}), 200
        except Exception as e:
            print(f"CHYBA při mazání projektu: {e}")
            return jsonify({"error": "Chyba při mazání projektu"}), 500
        
    return jsonify({"error": "Projekt nebyl nalezen"}), 404

if __name__ == '__main__':
    # Ujisti se, že název souboru odpovídá tomu, jak aplikaci spouštíš.
    # Pokud spouštíš "python app_main.py", tento řádek je v pořádku.
    app.run(host='0.0.0.0', port=5000, debug=True)