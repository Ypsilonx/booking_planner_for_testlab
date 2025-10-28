# Booking Planner for Test Lab

## 📋 Popis projektu

Webová aplikace pro správu rezervací testovacího laboratoře. Umožňuje plánování a organizaci využití testovacích zařízení s podporou blocker rezervací, kapacitního managementu a projektového sledování.

## 🚀 Funkce

### Základní funkce
- **Rezervační systém** - Grafický kalendář pro správu rezervací
- **Správa zařízení** - Management testovacích zařízení s kapacitami
- **Projektové sledování** - Organizace podle TMA čísel a projektů
- **Blocker rezervace** - Speciální typ rezervací bez spotřeby kapacity
- **Multi-user podpora** - SQLite databáze pro současnou práci více uživatelů

### Pokročilé funkce
- **Custom kapacity** - Možnost nastavení specifických kapacit pro zařízení
- **Collision detection** - Automatická detekce konfliktů v rezervacích
- **TMA čísla** - Automatické extrakce a správa TMA čísel projektů
- **Inline editace** - Rychlá editace přímo v kalendáři
- **Drag & Drop** - Intuitivní přesouvání rezervací

## 🏗️ Architektura

### Backend
- **Flask** - Python web framework
- **SQLite** - Databáze pro persistentní ukládání
- **Modulární struktura** - Rozdělení do logických celků

```
app_main.py          # Hlavní aplikace
db.py               # Databázové utility
utils.py            # Pomocné funkce
routes/
  ├── bookings.py   # API pro rezervace
  ├── equipment.py  # API pro zařízení
  └── projects.py   # API pro projekty
```

### Frontend
- **HTML/CSS/JavaScript** - Vanilla frontend bez frameworku
- **Bootstrap** - Responzivní design
- **Kalendářové zobrazení** - Custom implementace

### Databáze
```sql
-- Rezervace s TMA čísly
bookings (id, equipment_id, project_id, start_date, end_date, 
          description, text_style, tma_number, is_blocker)

-- Zařízení s kapacitami
equipment (id, name, capacity, category, side)

-- Projekty
projects (id, name, description, start_date, end_date)
```

## ⚙️ Instalace a spuštění

### Požadavky
- Python 3.8+
- pip (správce balíčků pro Python)
- Git (volitelné, pro klonování)

### Rychlé spuštění

#### 1. Klonování projektu
```bash
git clone <repository-url>
cd booking_planner_for_testlab
```

#### 2. Vytvoření virtuálního prostředí (doporučeno)
**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3. Instalace závislostí
```bash
pip install -r requirements.txt
```

**Nebo ruční instalace:**
```bash
pip install flask requests
```

#### 4. Inicializace databáze (pouze první spuštění)
```bash
python db_init.py
```

#### 5. Spuštění aplikace
```bash
python app_main.py
```

Aplikace bude dostupná na `http://localhost:5000`

### 🔄 Deaktivace virtuálního prostředí
Po ukončení práce deaktivujte venv:
```bash
deactivate
```

### Migrace z JSON dat
Pokud máte existující data v JSON souborech (`equipment.json`, `projects.json`):
```bash
python db_init.py
```
Script automaticky extrahuje TMA čísla z popisů a vytvoří SQLite databázi.

## 🔧 API Endpointy

### Rezervace
```http
GET    /api/bookings              # Seznam všech rezervací
POST   /api/bookings              # Vytvoření nové rezervace
PUT    /api/bookings/<id>         # Aktualizace rezervace
DELETE /api/bookings/<id>         # Smazání rezervace
```

### Zařízení
```http
GET    /api/equipment             # Seznam zařízení
POST   /api/equipment             # Přidání zařízení
PUT    /api/equipment/<id>        # Aktualizace zařízení
DELETE /api/equipment/<id>        # Smazání zařízení
```

### Projekty
```http
GET    /api/projects              # Seznam projektů
POST   /api/projects              # Vytvoření projektu
PUT    /api/projects/<id>         # Aktualizace projektu
DELETE /api/projects/<id>         # Smazání projektu
```

### Data endpoint
```http
GET    /api/data                  # Kompletní data pro frontend
```

## 📝 Použití

### Vytvoření rezervace
1. Klikněte na zvolené zařízení v kalendáři
2. Vyplňte formulář rezervace
3. **TMA číslo** - zadejte ve formátu `EU-SVA-123456-25`
4. **Blocker** - zaškrtněte pro rezervace bez spotřebykapacity
5. Klikněte "Vytvořit rezervaci"

### Správa zařízení
1. Otevřete Equipment Management (tlačítko vpravo nahoře)
2. Double-click na zařízení pro editaci
3. Upravte název, kapacitu nebo kategorii
4. Změny se automaticky ukládají

### TMA čísla
- Automaticky extrahovány z popisů při migraci
- Ukládány v separátním sloupci `tma_number`
- Frontend má dedikované pole pro zadání TMA čísla

## 🚧 Známé problémy a omezení

### Aktuální stav
- ✅ Modularizace kódu dokončena
- ✅ Migrace na SQLite provedena
- ✅ TMA čísla separována
- ✅ API endpointy implementovány
- ✅ Collision detection funguje

### Budoucí vylepšení
- [ ] Autentifikace uživatelů
- [ ] Pokročilé filtrování a vyhledávání
- [ ] Export do Excel/CSV
- [ ] Email notifikace
- [ ] REST API dokumentace (Swagger)

## 🔒 Bezpečnost

### Aktuální stav
- Základní validace dat
- SQL injection ochrana (parametrizované dotazy)
- XSS ochrana v templatu

### Doporučení pro produkci
- Implementovat autentifikaci
- Přidat CSRF tokeny
- Nastavit HTTPS
- Audit log pro změny

## 📁 Struktura souborů

```
booking_planner_for_testlab/
├── README.md                 # Tato dokumentace
├── requirements.txt          # Python závislosti
├── .gitignore               # Git ignore soubor
├── app_main.py              # Hlavní Flask aplikace
├── db.py                    # Databázové utility funkce
├── db_init.py               # Migrační script (JSON → SQLite)
├── utils.py                 # Pomocné funkce (validace, collision detection)
├── booking_planner.db       # SQLite databáze (generována při prvním spuštění)
├── venv/                    # Virtuální prostředí (lokální, není v gitu)
├── routes/                  # API endpointy (Flask Blueprints)
│   ├── __init__.py
│   ├── bookings.py          # CRUD operace pro rezervace
│   ├── equipment.py         # CRUD operace pro zařízení
│   └── projects.py          # CRUD operace pro projekty
├── templates/               # Jinja2 HTML templaty
│   └── index.html           # Hlavní stránka aplikace
└── static/                  # Statické soubory (CSS, JS)
    ├── style.css            # Styly aplikace
    └── script.js            # Frontend JavaScript logika
```

### Důležité soubory

- **`requirements.txt`** - Seznam všech Python závislostí s verzemi
- **`app_main.py`** - Vstupní bod aplikace, registrace blueprintů
- **`db.py`** - Funkce pro práci s databází (CRUD operace)
- **`utils.py`** - Validační funkce a logika detekce kolizí
- **`db_init.py`** - Jednorázový migrační script z JSON do SQLite
- **`.gitignore`** - Ignoruje `venv/`, `__pycache__/`, `*.db`, atd.

## 🤝 Přispívání

1. Vytvořte feature branch
2. Proveďte změny
3. Otestujte funkcionalita
4. Vytvořte pull request

## 📞 Kontakt

Pro otázky a podporu kontaktujte správce projektu.

---

**Vytvořeno:** 2025  
**Verze:** 2.0.0 (SQLite + Modular + Virtual Environment)  
**License:** MIT  
**Status:** Production Ready ✅  
**Python:** 3.8+  
**Framework:** Flask 3.1.2
