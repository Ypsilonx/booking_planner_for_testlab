# Booking Planner for Test Lab 📅

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.2-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()
[![Code Quality](https://img.shields.io/badge/Code%20Quality-A+-success.svg)]()

> Moderní webová aplikace pro správu rezervací testovacího laboratoře s plnou podporou kapacitního managementu, blocker rezervací a projektového sledování.

## 📋 O Projektu

**Booking Planner for Test Lab** je profesionální řešení pro organizaci a plánování využití testovacích zařízení. Aplikace nabízí intuitivní grafické rozhraní s kalendářovým zobrazením, automatickou detekcí kolizí a komplexní správou projektů včetně TMA čísel.

### ✨ Klíčové Vlastnosti

- 📆 **Grafický kalendář** - Intuitivní drag & drop rozhraní
- 🔒 **Blocker rezervace** - Rezervace bez spotřeby kapacity (údržba, dlouhodobé blokace)
- 🎯 **Automatická detekce kolizí** - Inteligentní kontrola překrývání a kapacity
- 🏷️ **TMA čísla** - Automatická extrakce a správa projektových identifikátorů
- ⚙️ **Kapacitní management** - Vlastní nastavení kapacit pro každé zařízení
- 👥 **Multi-user** - SQLite databáze pro spolupráci více uživatelů
- 🎨 **Projektové barvy** - Vizuální rozlišení projektů
- ✏️ **Inline editace** - Rychlá úprava přímo v kalendáři

---

## 📑 Obsah

- [Rychlý Start](#-rychlý-start)
- [Požadavky](#-požadavky)
- [Instalace](#-instalace)
- [Použití](#-použití)
- [Architektura](#-architektura)
- [API Dokumentace](#-api-dokumentace)
- [Vývoj](#-vývoj)
- [FAQ](#-faq)
- [Changelog](#-changelog)
- [Contributing](#-contributing)
- [Licence](#-licence)

---

---

## 🚀 Rychlý Start

### Za 5 Minut K Funkční Aplikaci

```bash
# 1. Klonování projektu
git clone <repository-url>
cd booking_planner_for_testlab

# 2. Vytvoření virtuálního prostředí
python -m venv venv

# 3. Aktivace prostředí
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# 4. Instalace závislostí
pip install -r requirements.txt

# 5. Inicializace databáze
python db_init.py

# 6. Spuštění aplikace
python app_main.py
```

**Aplikace běží na:** `http://localhost:5000` 🎉

### První Kroky

1. **Přidejte zařízení** - Klikněte na "Equipment Management" a vytvořte testovací zařízení
2. **Vytvořte projekt** - V modálu rezervace zadejte název projektu a barvu
3. **Rezervujte** - Klikněte na zařízení v kalendáři a vyplňte formulář
4. **TMA číslo** - Zadejte ve formátu `EU-SVA-123456-25`

---

## 💻 Požadavky

### Minimální Požadavky
- **Python**: 3.8 nebo novější
- **RAM**: 512 MB
- **Disk**: 50 MB volného místa
- **Prohlížeč**: Chrome, Firefox, Edge, Safari (moderní verze)

### Doporučené
- **Python**: 3.10+
- **RAM**: 1 GB+
- **OS**: Windows 10/11, Linux, macOS

---

## 📦 Instalace

### Detailní Instalační Průvodce

#### 1️⃣ Příprava Prostředí

**Windows:**
```powershell
# Ověření Python instalace
python --version  # Mělo by vypsat Python 3.8+

# Vytvoření virtuálního prostředí
python -m venv venv

# Aktivace
.\venv\Scripts\Activate.ps1

# Řešení problémů s Execution Policy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Linux/macOS:**
```bash
# Ověření Python instalace
python3 --version

# Vytvoření virtuálního prostředí
python3 -m venv venv

# Aktivace
source venv/bin/activate
```

#### 2️⃣ Instalace Závislostí

**Automatická instalace:**
```bash
pip install -r requirements.txt
```

**Manuální instalace** (pokud requirements.txt chybí):
```bash
pip install flask==3.1.2 requests==2.32.5
```

#### 3️⃣ Inicializace Databáze

```bash
# První spuštění - vytvoří prázdnou databázi
python db_init.py
```

**Migrace z JSON** (pokud máte legacy data):
```bash
# Umístěte soubory bookings_data.json, equipment.json, projects.json do kořene
python db_init.py  # Automaticky importuje data
```

#### 4️⃣ Spuštění

**Vývojový režim:**
```bash
python app_main.py
```

**Produkční režim** (Linux/macOS):
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app_main:app
```

**Produkční režim** (Windows):
```bash
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 app_main:app
```

#### 5️⃣ Deaktivace Prostředí

```bash
deactivate
```

---

## 🎯 Použití

### Základní Workflow

#### Vytvoření Rezervace
1. Klikněte na zvolené zařízení v kalendáři
2. Vyplňte formulář:
   - **Popis**: Stručný popis testu
   - **TMA číslo**: `EU-SVA-123456-25` (automaticky se oddělí)
   - **Datum začátku/konce**: Vyberte rozsah
   - **Projekt**: Vyberte existující nebo vytvořte nový
   - **Poznámka**: Volitelné detaily
   - **Blocker**: Zaškrtněte pro blokovací rezervaci
3. Klikněte "Vytvořit rezervaci"

#### Editace Rezervace
- **Přesunutí**: Drag & drop rezervace na nové datum
- **Úprava**: Double-click na rezervaci → upravte údaje
- **Smazání**: Klikněte na rezervaci → tlačítko "Smazat"

#### Správa Zařízení
1. Klikněte "Equipment Management" (vpravo nahoře)
2. **Přidat**: Klikněte "Add Equipment"
3. **Upravit**: Double-click na zařízení
4. **Nastavení kapacity**: Změňte `max_tests` (např. 2 = dvě paralelní rezervace)
5. **Kategorie**: Slouží k organizaci zařízení

#### Správa Projektů
- **Vytvoření**: Při první rezervaci zadejte nový název projektu
- **Barva**: Vyberte barvu pro vizuální rozlišení
- **TMA čísla**: Automaticky přiřazena k projektům

### Pokročilé Funkce

#### Blocker Rezervace
- Používejte pro údržbu, kalibraci nebo dlouhodobé blokace
- **Nespotřebovává kapacitu** - ostatní rezervace mohou běžet paralelně
- Vizuálně odlišena (jiný styl)

#### Kapacitní Management
- Každé zařízení má `max_tests` (výchozí: 1)
- Příklad: `max_tests=3` → 3 současné rezervace na stejném zařízení
- Blocker rezervace se nepočítají do limitu

#### TMA Čísla
- Formát: `EU-SVA-XXXXXX-YY` (např. `EU-SVA-123456-25`)
- Automaticky extrahovány z popisu při migraci
- V novém systému samostatné pole

---

## 🏗️ Architektura

### Technologický Stack

**Backend:**
- **Framework**: Flask 3.1.2 (Python web framework)
- **Databáze**: SQLite 3 (embedded relational DB)
- **Architektura**: Modular Blueprints

**Frontend:**
- **UI**: Vanilla JavaScript (žádný framework)
- **Styling**: Custom CSS + Bootstrap
- **Interaktivita**: Drag & Drop, inline editing

### Struktura Projektu

```
booking_planner_for_testlab/
│
├── 📄 config.py              # Centralizovaná konfigurace ⭐ NEW
├── 📄 app_main.py            # Flask aplikace + routing
├── 📄 db.py                  # Databázové utility (s type hints)
├── 📄 db_init.py             # Migrační script JSON → SQLite
├── 📄 utils.py               # Validace + collision detection
├── 📄 requirements.txt       # Python dependencies
├── 📊 booking_planner.db     # SQLite databáze (auto-created)
│
├── 📁 routes/                # API Blueprints
│   ├── __init__.py          # Export blueprintů
│   ├── bookings.py          # CRUD pro rezervace
│   ├── equipment.py         # CRUD pro zařízení
│   └── projects.py          # CRUD pro projekty
│
├── 📁 templates/             # Jinja2 HTML templaty
│   └── index.html           # Main SPA
│
├── 📁 static/                # Frontend assets
│   ├── script.js            # Frontend logika (1760 řádků)
│   └── style.css            # Styling
│
└── 📁 venv/                  # Virtual environment (local)
```

### Databázové Schéma

```sql
-- Rezervace
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY,
    description TEXT,
    tma_number TEXT,              -- Oddělené TMA číslo
    start_date TEXT,
    end_date TEXT,
    equipment_id TEXT,
    project_name TEXT,
    project_color TEXT,
    note TEXT,
    is_blocker INTEGER,           -- 0/1 boolean
    text_style TEXT               -- JSON string
);

-- Zařízení
CREATE TABLE equipment (
    name TEXT PRIMARY KEY,
    category TEXT,
    max_tests INTEGER,            -- Kapacita
    sides INTEGER,
    status TEXT
);

-- Projekty
CREATE TABLE projects (
    name TEXT PRIMARY KEY,
    color TEXT,
    textColor TEXT,
    active INTEGER                -- 0/1 boolean
);
```

### Code Quality Features

✅ **Type Hints** - Kompletní type annotations v celém backendu  
✅ **Docstrings** - Všechny funkce a moduly dokumentovány  
✅ **Error Handling** - Try-except bloky všude  
✅ **Config Management** - Centralizované konstanty  
✅ **Context Managers** - Správné DB connection handling  
✅ **Modular Design** - Čisté oddělení concerns  

---

## 🌐 API Dokumentace

### Endpointy

#### 📊 Data Endpoint
```http
GET /api/data
```
Vrací kompletní data pro frontend (equipment, bookings, projects).

**Response:**
```json
{
  "equipment": [...],
  "bookings": [...],
  "projects": [...]
}
```

---

#### 📅 Bookings API

**Seznam rezervací**
```http
GET /api/bookings
```

**Vytvoření rezervace**
```http
POST /api/bookings
Content-Type: application/json

{
  "description": "Test ABC",
  "tma_number": "EU-SVA-123456-25",
  "start_date": "2025-01-15",
  "end_date": "2025-01-20",
  "equipment_id": "EQPT-001",
  "project_name": "Projekt A",
  "project_color": "#4a90e2",
  "note": "Poznámka",
  "is_blocker": false,
  "text_style": {}
}
```

**Aktualizace rezervace**
```http
PUT /api/bookings/{booking_id}
Content-Type: application/json

{ /* stejná struktura jako POST */ }
```

**Smazání rezervace**
```http
DELETE /api/bookings/{booking_id}
```

**Response Codes:**
- `200 OK` - Úspěch
- `201 Created` - Vytvořeno
- `400 Bad Request` - Chybná data
- `409 Conflict` - Kolize/duplicita
- `500 Internal Server Error` - Chyba serveru

---

#### 🔧 Equipment API

**Seznam zařízení**
```http
GET /api/equipment
```

**Vytvoření zařízení**
```http
POST /api/equipment
Content-Type: application/json

{
  "name": "Test Chamber 01",
  "category": "Environmental",
  "max_tests": 2,
  "sides": 1,
  "status": "active"
}
```

**Aktualizace**
```http
PUT /api/equipment/{equipment_name}
```

**Smazání**
```http
DELETE /api/equipment/{equipment_name}
```

---

#### 🏷️ Projects API

**Seznam projektů**
```http
GET /api/projects
```

**Vytvoření projektu**
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Projekt XYZ",
  "color": "#ff6b6b",
  "textColor": "#ffffff",
  "active": true
}
```

**Aktualizace**
```http
PUT /api/projects/{project_name}
```

**Smazání**
```http
DELETE /api/projects/{project_name}
```

---

## 🛠️ Vývoj

### Best Practices

#### Code Style
```python
# Type hints všude
def create_booking(data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Create new booking with validation.
    
    Args:
        data: Booking data dictionary
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    pass

# Konstanty v config.py
from config import MAX_DESCRIPTION_LENGTH

# Context manager pro DB
from db import get_db_connection

with get_db_connection() as conn:
    cursor = conn.cursor()
    # ... operace ...
# Automaticky zavře spojení
```

#### Commit Messages
```
feat: Přidání exportu do CSV
fix: Oprava collision detection pro blokery
refactor: Extrakce validace do utils.py
docs: Aktualizace API dokumentace
```

### Testování

**Před commitem:**
```bash
# Import check
python -c "import app_main, db, utils, config"

# Syntax check
python -m py_compile app_main.py db.py utils.py

# Spuštění aplikace
python app_main.py
# Ctrl+C pro ukončení
```

**API testy:**
```powershell
# GET test
Invoke-RestMethod -Uri "http://localhost:5000/api/data" -Method GET

# POST test
$body = @{ description = "Test" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method POST -Body $body -ContentType "application/json"
```

### Přidání Nové Funkce

1. **Vytvoř branch:** `git checkout -b feature/nova-funkce`
2. **Implementuj změny** s type hints a docstringy
3. **Testuj manuálně**
4. **Commit:** `git commit -m "feat: popis"`
5. **Push:** `git push origin feature/nova-funkce`
6. **Vytvoř Pull Request**

---

## ❓ FAQ

### Obecné

**Q: Je aplikace zdarma?**  
A: Ano, 100% open-source pod MIT licencí.

**Q: Podporuje více uživatelů?**  
A: Ano, SQLite umožňuje concurrent access. Pro vysokou zátěž doporučujeme PostgreSQL.

**Q: Kde se ukládají data?**  
A: V souboru `booking_planner.db` (SQLite databáze).

### Instalace

**Q: Python není nainstalován, co dělat?**  
A: Stáhněte z [python.org](https://www.python.org/downloads/) a zaškrtněte "Add Python to PATH".

**Q: Chyba při aktivaci venv (Windows)?**  
A: Spusťte: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**Q: Port 5000 je obsazený?**  
A: V `config.py` změňte `APP_PORT = 8080` na jiný port.

### Používání

**Q: Co je blocker rezervace?**  
A: Rezervace která blokuje zařízení, ale nespotřebovává kapacitu. Ideální pro údržbu.

**Q: Jak funguje detekce kolizí?**  
A: Systém kontroluje časové překrytí a kapacitu. Blokery se nepočítají do limitu.

**Q: Mohu exportovat data?**  
A: Aktuálně ne (planned feature). Můžete kopírovat `booking_planner.db` nebo použít SQL dotazy.

### Problémy

**Q: Aplikace se nespustí - "Address already in use"?**  
A: Port je obsazený. Změňte port nebo zastavte process: `netstat -ano | findstr :5000`

**Q: Chyba "No module named 'flask'"?**  
A: Nainstalujte dependencies: `pip install -r requirements.txt`

**Q: Rezervace se neuloží?**  
A: Zkontrolujte konzoli prohlížeče (F12) a terminál serveru pro chybové hlášky.

**Q: Jak resetovat databázi?**  
A: Smažte `booking_planner.db` a spusťte `python db_init.py`.

### Produkce

**Q: Je aplikace production-ready?**  
A: Backend ano, ale doporučujeme:
- Přidat autentifikaci (Flask-Login)
- Povolit HTTPS (nginx reverse proxy)
- Použít WSGI server (gunicorn/waitress)
- Pravidelné zálohy databáze

**Q: Podporuje HTTPS?**  
A: Development server ne. Pro HTTPS použijte nginx jako reverse proxy.

**Q: Kolik rezervací aplikace zvládne?**  
A: SQLite zvládne tisíce záznamů. Pro desítky tisíc migrujte na PostgreSQL.

---

## 📜 Changelog

### [2.0.1] - 2025-12-25

#### ✨ Refaktorizace a Vylepšení

**Přidáno:**
- ✅ `config.py` - Centralizovaná konfigurace
- ✅ Type hints - Všude v backendu
- ✅ Docstringy - Kompletní dokumentace
- ✅ Error handling - Try-except bloky všude
- ✅ Context manager `get_db_connection()`

**Změněno:**
- ♻️ Imports přesunuty na začátek
- ♻️ Používání config konstant
- ♻️ Lepší validace vstupních dat

**Odstraněno:**
- ❌ `test_api.py` - Testovací soubor
- ❌ `test_migration.py` - Testovací soubor
- ❌ `equipment.json` - Legacy data
- ❌ `projects.json` - Legacy data

**Opraveno:**
- 🐛 Duplicitní DB_PATH konstanta
- 🐛 Nekonzistentní imports
- 🐛 Neošetřené výjimky

### [2.0.0] - 2025

- 🎉 Migrace z JSON na SQLite
- 🎉 Modulární architektura (Blueprints)
- 🎉 Separace TMA čísel
- 🎉 API endpointy
- 🎉 Virtuální prostředí

---

## 🤝 Contributing

Vítáme příspěvky! Než začnete:

### Jak Přispět

1. **Fork** repozitář
2. **Clone** svůj fork: `git clone <your-fork-url>`
3. **Branch**: `git checkout -b feature/nova-funkce`
4. **Vývoj** - dodržujte code style (type hints, docstringy)
5. **Test** - ověřte že vše funguje
6. **Commit**: `git commit -m "feat: popis"`
7. **Push**: `git push origin feature/nova-funkce`
8. **Pull Request** - popište změny

### Code Style

- **PEP 8** pro Python
- **Type hints** povinné
- **Docstringy** pro všechny funkce
- **Error handling** - try-except bloky
- **Konstanty** - pouze v `config.py`

### Příklad
```python
def validate_data(data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validate input data.
    
    Args:
        data: Input dictionary
        
    Returns:
        (is_valid, error_message) tuple
    """
    try:
        # Validation logic
        pass
    except Exception as e:
        return False, str(e)
```

### Hlášení Chyb

Vytvořte Issue s:
- Popis problému
- Kroky k reprodukci
- Očekávané vs. aktuální chování
- Prostředí (OS, Python verze)
- Screenshoty (pokud relevantní)

---

## 📄 Licence

MIT License - viz [LICENSE](LICENSE) soubor

Copyright (c) 2025 Booking Planner for Test Lab

---

## 🙏 Poděkování

Díky všem přispěvatelům a uživatelům tohoto projektu!

---

## 📞 Kontakt & Podpora

- 🐛 **Bugy**: [Issues](../../issues)
- 💡 **Feature Requests**: [Issues](../../issues/new/choose)
- 📖 **Dokumentace**: Tento README
- 💬 **Diskuze**: [Discussions](../../discussions)

---

**⭐ Pokud vám projekt pomohl, dejte mu hvězdičku na GitHubu! ⭐**

*Poslední aktualizace: 25. prosince 2025*  
*Verze: 2.0.1*
