# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Příkazy

Projekt používá **uv** pro správu virtuálního prostředí a závislostí (`pyproject.toml` + `uv.lock`). `requirements.txt` je jen odvozený export pro uživatele bez uv (`uv export --no-hashes --no-header --no-annotate -o requirements.txt`) – needituj ho ručně, needituj verze v `pyproject.toml` ručně, používej `uv add`/`uv remove`.

```bash
# Vytvoření/aktualizace .venv dle pyproject.toml + uv.lock
uv sync

# Inicializace DB (vytvoří tabulky bookings/equipment/projects, případně migruje legacy JSON)
uv run python db_init.py

# Vytvoření tabulky equipment_capacity_overrides (samostatný skript, NENÍ součástí db_init.py)
uv run python add_capacity_overrides.py

# Spuštění aplikace (dev server, port dle config.APP_PORT, debug=True)
uv run python app_main.py

# Rychlá kontrola před commitem (v repu nejsou žádné automatizované testy)
uv run python -c "import app_main, db, utils, config"
uv run python -m py_compile app_main.py db.py utils.py
```

Testovací data lze naplnit skriptem `populate_test_data.py`. Neexistuje žádný test framework (pytest apod.) ani CI test krok – ověření je vždy manuální (import check + ruční proklik v prohlížeči nebo `curl`).

### Port serveru – ověř před spuštěním

`APP_PORT` v `config.py` je **5050** (ne výchozích 5000 z Flasku) – na tomto stroji port 5000 dlouhodobě obsazuje Logitech G HUB (`CS_GO_Arx_Applet.exe`), který na `127.0.0.1:5000` poslouchá jako lokální služba. Windows dovolí Flasku nabindovat `0.0.0.0:5000` i přes to, ale příchozí spojení se pak nepředvídatelně routují mezi oba procesy – server se navenek tváří jako běžící, ale requesty končí jako "empty reply" bez chyby v logu. Nejde o bug v kódu, jde o kolizi portu.

Než spustíš `app_main.py` (zvlášť pokud bys port měnil zpět nebo testoval na jiném portu), over si, že není obsazený:

```bash
netstat -ano | grep ":<PORT>"   # nic = port je volný
```

Pokud tam něco je, zkontroluj vlastníka přes `Get-Process -Id <PID>` (PowerShell) – nezabíjej cizí procesy naslepo (`taskkill /IM python.exe` bez PID zabije všechny python procesy v systému, ne jen ten tvůj).

Po debugování na pozadí (spuštěné přes `run_in_background`/`&`) vždy ověř `netstat`, že po skončení práce nezůstal viset osiřelý proces s Flask debug reloaderem – ten drží port i po zdánlivém ukončení nadřazeného procesu.

## Architektura

Flask + SQLite (soubor `booking_planner.db`), server-rendered `index.html` + vanilla JS SPA vrstva ve `static/script.js` (~1760 řádků, viz `static/JAVASCRIPT_GUIDE.md` pro mapu sekcí a datový tok).

- `pyproject.toml` / `uv.lock` – zdroj pravdy pro závislosti (viz sekce Příkazy výše).
- `config.py` – veškeré konstanty (cesty, limity, defaulty, TMA regex). Nové magic hodnoty patří sem, ne inline do kódu.
- `db.py` – dvě paralelní cesty k DB:
  - `get_db_connection()` context manager (row_factory, auto-rollback) – preferovaný způsob, používá se ve všech `routes/` souborech kromě `projects.py`.
  - `db_connect()` – legacy raw connection bez context manageru, používá se jen v `routes/projects.py`. Při úpravách tohoto souboru buď zachovej styl, nebo cíleně migruj na `get_db_connection()`.
- `utils.py` – `validate_booking_data()` a `check_collision()`. Kolizní logika je časově náročná (iteruje den po dni v rozsahu rezervace × všechny existující rezervace) a pro každý den volá `get_effective_capacity()`, což je samostatný DB dotaz – při úpravách dávej pozor na výkon při větším množství dat.
- `routes/` – Flask blueprinty. `equipment.py` (`equipment_bp`) má jen GET `/api/equipment` (read-only listing). Zápisové operace (POST/PUT/DELETE) i capacity-overrides jsou v `equipment_mgmt.py` (`equipment_mgmt_bp`) – dřív se stejná route `/api/equipment` duplicitně definovala v obou souborech (opraveno), takže zápisové handlery patří výhradně do `equipment_mgmt.py`, needuplikuj je zpět do `equipment.py`.

### Datový model

- **bookings**: `equipment_id` je string tvaru `"NázevZařízení"` nebo `"NázevZařízení - strana"` (u vícestranných zařízení) – `check_collision()` odděluje bázový název přes `equipment_id.split(' - ')[0]`. `is_blocker` rezervace nespotřebovává kapacitu. `text_style` je JSON string uložený v DB, parsovaný při čtení.
- **equipment**: `name` je primární klíč (žádné numerické ID) – equipment se všude referencuje jménem, ne ID.
- **equipment_capacity_overrides**: dočasné přepisy `max_tests` pro konkrétní zařízení a datový rozsah; `get_effective_capacity()` je kontroluje přednostně před základní kapacitou v `equipment`.
- **projects**: `name` je primární klíč; barvy (`color`, `textColor`) se vážou k projektu, ne k jednotlivé rezervaci (přestože `bookings.project_color` existuje jako denormalizovaná kopie).

### TMA čísla

Formát `EU-SVA-XXXXXX-YY` (regex v `config.TMA_REGEX_PATTERN`). V novém schématu je `tma_number` samostatný sloupec; extrakce z volného textu popisu se děje pouze při jednorázové migraci legacy JSON dat (`db_init.py`), ne za běhu aplikace.
