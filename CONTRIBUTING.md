# Přispívání do projektu

Děkujeme za váš zájem o přispívání do projektu Booking Planner for Test Lab!

## 🚀 Jak začít

1. **Forkněte repozitář** na svůj GitHub účet
2. **Klonujte** svůj fork lokálně:
   ```bash
   git clone https://github.com/vas-username/booking_planner_for_testlab.git
   ```
3. **Vytvořte novou větev** pro vaši funkci:
   ```bash
   git checkout -b feature/nova-funkce
   ```

## 💻 Vývojové prostředí

### Nastavení
```bash
# Vytvořte virtuální prostředí
python -m venv venv

# Aktivujte prostředí
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Nainstalujte závislosti
pip install -r requirements.txt

# Inicializujte databázi
python db_init.py

# Spusťte aplikaci
python app_main.py
```

## 📝 Kódovací standardy

### Python
- Používejte **PEP 8** styl pro Python kód
- Maximální délka řádku: **88 znaků** (Black formatter)
- Používejte **type hints** kde je to možné
- Dokumentujte funkce pomocí **docstrings**

### Příklad:
```python
def validate_booking_data(booking_data: dict) -> tuple[bool, str]:
    """
    Validuje data rezervace.
    
    Args:
        booking_data: Slovník s daty rezervace
        
    Returns:
        Tuple (je_validní, chybová_zpráva)
    """
    # Kód zde...
    pass
```

### Commit zprávy
Používejte konvenci **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Typy:**
- `feat:` - Nová funkce
- `fix:` - Oprava chyby
- `docs:` - Změny v dokumentaci
- `style:` - Formátování, chybějící středníky, atd.
- `refactor:` - Refaktoring kódu
- `test:` - Přidání testů
- `chore:` - Údržba, aktualizace závislostí

**Příklady:**
```
feat(bookings): přidána podpora pro opakující se rezervace

fix(collision): oprava detekce kolizí pro blocker rezervace

docs(readme): aktualizace instalačních instrukcí
```

## 🧪 Testování

Před odesláním pull requestu:

1. **Otestujte manuálně** všechny změny
2. **Zkontrolujte** že aplikace běží bez chyb
3. **Ověřte** že nové funkce neporušily existující funkcionalitu

```bash
# Spusťte aplikaci a otestujte
python app_main.py
```

## 📤 Odeslání změn

1. **Commitněte** své změny:
   ```bash
   git add .
   git commit -m "feat: popis změny"
   ```

2. **Pushněte** do vašeho forku:
   ```bash
   git push origin feature/nova-funkce
   ```

3. **Vytvořte Pull Request** na GitHubu
   - Jasně popište co bylo změněno
   - Přidejte screenshoty pokud měníte UI
   - Odkazujte na související issue číslo

## 🐛 Hlášení chyb

Při hlášení chyby prosím uveďte:

- **Popis problému** - Co se stalo?
- **Kroky k reprodukci** - Jak problém vyvolat?
- **Očekávané chování** - Co mělo být?
- **Aktuální chování** - Co se stalo místo toho?
- **Prostředí** - OS, verze Pythonu, atd.
- **Screenshoty** - Pokud relevantní

## 💡 Návrhy na vylepšení

Máte nápad na novou funkci? Skvělé!

1. Nejprve **vytvořte Issue** pro diskuzi
2. Popište **use case** a **benefit** funkce
3. Vyčkejte na **schválení** před začátkem vývoje
4. Poté vytvořte **Pull Request** s implementací

## ❓ Otázky?

Pokud máte jakékoli otázky:
- Otevřete **Issue** s labelkem `question`
- Kontaktujte maintainera projektu

---

Děkujeme za vaše příspěvky! 🎉
