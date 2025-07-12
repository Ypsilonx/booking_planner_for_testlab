# -*- coding: utf-8 -*-
# --- Rezervační systém ve Flask v4.2 (Zjednodušená struktura zařízení) ---

from flask import Flask, jsonify, render_template, request
import datetime
import json

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

BOOKINGS_FILE = 'bookings_data.json'
EQUIPMENT_FILE = 'equipment.json'

def load_equipment():
    """Načte seznam zařízení z externího JSON souboru."""
    try:
        with open(EQUIPMENT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"VAROVÁNÍ: Soubor '{EQUIPMENT_FILE}' nebyl nalezen nebo je neplatný.")
        return []

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_all_data():
    """API endpoint, který vrací všechna data (zařízení a rezervace)."""
    equipment = load_equipment()
    bookings_data = load_bookings()
    return jsonify({
        "equipment": equipment,
        "bookings": bookings_data.get("bookings", [])
    })

def check_collision(new_booking, all_bookings, all_equipment):
    """
    Zkontroluje, zda nová rezervace nepřekračuje maximální kapacitu zařízení.
    """
    try:
        # Z kompozitního ID (např. "FASI big - Prostor 1") získáme název hlavního zařízení
        base_equipment_name = new_booking['equipment_id'].split(' - ')[0].strip()
        equipment_details = next((e for e in all_equipment if e['name'] == base_equipment_name), None)
        
        if not equipment_details: return True 

        max_tests = equipment_details.get('max_tests', 1)
    except (IndexError, KeyError):
        return True
    
    overlapping_count = 0
    new_start = datetime.date.fromisoformat(new_booking['start_date'])
    new_end = datetime.date.fromisoformat(new_booking['end_date'])

    for booking in all_bookings:
        if 'id' in new_booking and new_booking['id'] == booking['id']:
            continue

        if new_booking['equipment_id'] == booking['equipment_id']:
            existing_start = datetime.date.fromisoformat(booking['start_date'])
            existing_end = datetime.date.fromisoformat(booking['end_date'])
            if max(new_start, existing_start) <= min(new_end, existing_end):
                overlapping_count += 1

    return overlapping_count >= max_tests

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    new_booking_data = request.json
    bookings_data = load_bookings()
    all_equipment = load_equipment()
    
    if check_collision(new_booking_data, bookings_data['bookings'], all_equipment):
        return jsonify({"error": "Booking collision detected or capacity exceeded"}), 409
        
    new_id = bookings_data.get('next_booking_id', 101)
    new_booking_data['id'] = new_id
    bookings_data['bookings'].append(new_booking_data)
    bookings_data['next_booking_id'] = new_id + 1
    save_bookings(bookings_data)
    return jsonify(new_booking_data), 201

@app.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    updated_booking_data = request.json
    bookings_data = load_bookings()
    all_equipment = load_equipment()

    updated_booking_data['id'] = booking_id

    if check_collision(updated_booking_data, bookings_data['bookings'], all_equipment):
        return jsonify({"error": "Booking collision detected or capacity exceeded"}), 409

    booking_index = next((i for i, b in enumerate(bookings_data['bookings']) if b['id'] == booking_id), None)
    
    if booking_index is not None:
        bookings_data['bookings'][booking_index] = updated_booking_data
        save_bookings(bookings_data)
        return jsonify(updated_booking_data)
    
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

if __name__ == '__main__':
    # Ujisti se, že název souboru odpovídá tomu, jak aplikaci spouštíš.
    # Pokud spouštíš "python app_main.py", tento řádek je v pořádku.
    app.run(host='0.0.0.0', port=5000, debug=True)