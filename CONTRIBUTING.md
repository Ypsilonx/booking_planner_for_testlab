# Přispívání do Projektu 🤝

Děkujeme za váš zájem o přispívání do **Booking Planner for Test Lab**!

## 📋 Obsah

- [Jak Začít](#-jak-začít)
- [Vývojové Prostředí](#-vývojové-prostředí)
- [Code Style](#-code-style)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Hlášení Chyb](#-hlášení-chyb)
- [Feature Requests](#-feature-requests)

---

## 🚀 Jak Začít

### 1. Fork a Clone

```bash
# Fork repozitář na GitHubu (tlačítko "Fork")

# Clone svůj fork
git clone https://github.com/<your-username>/booking_planner_for_testlab.git
cd booking_planner_for_testlab

# Přidej upstream remote
git remote add upstream https://github.com/<original-repo>/booking_planner_for_testlab.git
```

### 2. Vytvoř Branch

```bash
# Sync s upstream
git fetch upstream
git checkout main
git merge upstream/main

# Vytvoř feature branch
git checkout -b feature/nova-funkce
```

---

## 💻 Vývojové Prostředí

### Nastavení

```bash
# Vytvoř virtuální prostředí
python -m venv venv

# Aktivuj prostředí
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Nainstaluj dependencies
pip install -r requirements.txt

# Inicializuj databázi
python db_init.py

# Spusť aplikaci
python app_main.py
```

### Recommended Tools

- **Editor**: VS Code, PyCharm
- **Extensions** (VS Code):
  - Python
  - Pylance (type checking)
  - GitLens
  - Better Comments

---

## 📝 Code Style

### Python - PEP 8

**Základní Pravidla:**
- Odsazení: **4 mezery** (ne taby)
- Maximální délka řádku: **88 znaků** (Black formatter)
- Docstringy: **Google style** nebo **NumPy style**
- Imports: Vždy na začátku souboru

### Type Hints (POVINNÉ)

```python
from typing import List, Dict, Any, Tuple, Optional

def my_function(param: str, count: int = 1) -> Tuple[bool, str]:
    """
    Stručný popis funkce.
    
    Args:
        param: Popis parametru
        count: Popis s default hodnotou
        
    Returns:
        Tuple (success: bool, message: str)
        
    Raises:
        ValueError: Pokud param je prázdný
    """
    if not param:
        raise ValueError("Parametr nesmí být prázdný")
    
    return True, f"Processed {param}"
```

### Docstrings (POVINNÉ)

**Module Level:**
```python
"""
Stručný popis modulu.

Delší popis co modul dělá, jaké má funkce,
a jak se používá.

Functions:
    - function1: Stručný popis
    - function2: Stručný popis
"""
```

**Function Level:**
```python
def validate_booking(data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validuje booking data před uložením.
    
    Kontroluje povinná pole, formát dat, a business logiku.
    
    Args:
        data: Dictionary s booking daty (description, dates, etc.)
        
    Returns:
        Tuple containing:
            - is_valid (bool): True pokud data jsou validní
            - error_message (str): Chybová zpráva nebo prázdný string
            
    Examples:
        >>> validate_booking({"description": "Test", "start_date": "2025-01-01"})
        (True, "")
        
        >>> validate_booking({})
        (False, "Chybí povinné pole: description")
    """
    pass
```

### Error Handling (POVINNÉ)

```python
@app.route('/api/resource', methods=['POST'])
def create_resource() -> Tuple[dict, int]:
    """Create new resource with validation."""
    try:
        # 1. Validace vstupu
        data = request.json
        if not data:
            return jsonify({"error": "Chybí data"}), 400
        
        # 2. Business logika
        result = process_data(data)
        
        # 3. DB operace
        with get_db_connection() as conn:
            conn.execute("INSERT ...")
            conn.commit()
        
        # 4. Success response
        return jsonify(result), 201
        
    except ValueError as e:
        return jsonify({"error": f"Validační chyba: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "Interní chyba serveru"}), 500
```

### Konstanty v config.py

```python
# ❌ ŠPATNĚ - magic numbers/strings v kódu
if len(description) > 200:
    return False

# ✅ SPRÁVNĚ - konstanta v config.py
from config import MAX_DESCRIPTION_LENGTH

if len(description) > MAX_DESCRIPTION_LENGTH:
    return False
```

### Database Operations

```python
# ❌ ŠPATNĚ - bez context manageru
conn = db_connect()
cursor = conn.cursor()
cursor.execute("SELECT ...")
conn.close()  # Může být vynecháno při chybě!

# ✅ SPRÁVNĚ - s context managerem
from db import get_db_connection

with get_db_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT ...")
    # Automaticky zavře spojení i při chybě
```

---

## 🔖 Commit Guidelines

### Conventional Commits

Používáme **Conventional Commits** pro standardizované commit zprávy.

**Formát:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Použití | Příklad |
|------|---------|---------|
| `feat` | Nová funkcionalita | `feat(bookings): přidán export do CSV` |
| `fix` | Oprava bugu | `fix(collision): oprava detekce pro blokery` |
| `refactor` | Refaktoring bez změny funkcionality | `refactor(db): použití context manageru` |
| `docs` | Změny v dokumentaci | `docs(readme): aktualizace API sekce` |
| `style` | Formátování, whitespace | `style: Black formátování` |
| `test` | Přidání testů | `test(utils): unit testy pro validaci` |
| `chore` | Údržba, dependencies | `chore: update Flask to 3.1.2` |
| `perf` | Výkonnostní vylepšení | `perf(db): přidání indexů` |

### Scopes

- `bookings` - Rezervační systém
- `equipment` - Správa zařízení
- `projects` - Správa projektů
- `db` - Databázové operace
- `api` - API endpointy
- `ui` - Frontend
- `config` - Konfigurace

### Příklady

**Dobrý commit:**
```
feat(bookings): přidán export rezervací do CSV formátu

Implementován nový endpoint /api/bookings/export který umožňuje
stažení všech rezervací v CSV formátu. Podporuje filtrování podle
data a projektu.

Closes #42
```

**Špatný commit:**
```
update stuff
```

### Commit Checklist

Před commitem ověř:
- [ ] Code prošel testem: `python -c "import app_main"`
- [ ] Žádné syntax errors: `python -m py_compile <file>.py`
- [ ] Přidány type hints a docstringy
- [ ] Error handling implementován
- [ ] Commit message je descriptive

---

## 🔄 Pull Request Process

### 1. Před Vytvořením PR

```bash
# Sync s upstream
git fetch upstream
git rebase upstream/main

# Spusť testy
python -c "import app_main, db, utils, config"
python -m py_compile app_main.py db.py utils.py

# Spusť aplikaci a otestuj
python app_main.py
```

### 2. Vytvoření PR

**Checklist:**
- [ ] Branch je aktuální s `main`
- [ ] Všechny testy prošly
- [ ] Code je zdokumentovaný (docstringy)
- [ ] Type hints přidány
- [ ] Změny jsou otestované manuálně
- [ ] README aktualizován (pokud nutné)
- [ ] No console.log / debug printy

**PR Template:**
```markdown
## Popis

Stručný popis co tento PR dělá a proč.

## Typ změny

- [ ] Bugfix (oprava problému)
- [ ] New feature (nová funkcionalita)
- [ ] Breaking change (změna která ruší kompatibilitu)
- [ ] Documentation update

## Jak otestovat

1. Spusť aplikaci
2. Proveď XYZ
3. Ověř že ABC funguje

## Screenshots

(Pokud UI změny)

## Related Issues

Closes #123
```

### 3. Code Review

- Buď otevřený feedbacku
- Odpovídej na komentáře
- Proveď požadované změny promptně
- Po schválení merguj PR

---

## 🐛 Hlášení Chyb

### Před Vytvořením Issue

1. **Vyhledej** v existujících issues
2. **Ověř** že chyba existuje v latest verzi
3. **Zkus reprodukovat** na čisté instalaci

### Bug Report Template

```markdown
## Popis Problému

Jasný a stručný popis co je špatně.

## Kroky k Reprodukci

1. Jdi na '...'
2. Klikni na '...'
3. Vidíš chybu

## Očekávané Chování

Co mělo být.

## Aktuální Chování

Co se stalo místo toho.

## Prostředí

- OS: [Windows 11 / Ubuntu 22.04 / macOS]
- Python: [3.10.5]
- Flask: [3.1.2]
- Prohlížeč: [Chrome 120]

## Screenshots

(Pokud relevantní)

## Additional Context

Jakékoli další informace.
```

---

## 💡 Feature Requests

### Návrh Nové Funkce

```markdown
## Feature Description

Jasný popis co chceš přidat.

## Use Case

Proč je tato funkce užitečná? Jaký problém řeší?

## Proposed Solution

Jak by to mělo fungovat?

## Alternatives Considered

Jaké jiné možnosti jsi zvažoval?

## Additional Context

Screenshots, mockupy, atd.
```

### Diskuze Před Implementací

Pro větší features **vždy** vytvoř Issue a vyčkej na diskuzi před začátkem vývoje.

---

## 📚 Další Zdroje

- **PEP 8**: https://pep8.org/
- **Type Hints**: https://docs.python.org/3/library/typing.html
- **Flask Docs**: https://flask.palletsprojects.com/
- **Conventional Commits**: https://www.conventionalcommits.org/

---

## ❓ Otázky?

Pokud máš jakékoli otázky:
1. Přečti si [README.md](README.md)
2. Přečti si [FAQ sekci v README](README.md#-faq)
3. Vyhledej v [Issues](../../issues)
4. Vytvoř nový Issue s labelem `question`

---

**Děkujeme za váš příspěvek! 🙏**

*Every contribution, no matter how small, makes a difference.*
