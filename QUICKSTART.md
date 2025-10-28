# Quick Start Guide 🚀

Tento návod vám pomůže rychle zprovoznit aplikaci na vašem počítači.

## ⚡ 5minutový start

### 1️⃣ Stažení projektu
```bash
git clone https://github.com/your-username/booking_planner_for_testlab.git
cd booking_planner_for_testlab
```

### 2️⃣ Virtuální prostředí

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

### 3️⃣ Instalace
```bash
pip install -r requirements.txt
```

### 4️⃣ První spuštění
```bash
# Vytvoření prázdné databáze
python db_init.py

# Spuštění aplikace
python app_main.py
```

### 5️⃣ Otevřete prohlížeč
```
http://localhost:5000
```

## 🎯 Co dál?

- 📖 Přečtěte si [README.md](README.md) pro kompletní dokumentaci
- 🤝 Přispívejte podle [CONTRIBUTING.md](CONTRIBUTING.md)
- 🐛 Nahlaste chyby přes [GitHub Issues](../../issues)

## ❓ Problémy?

### Python není nainstalován
1. Stáhněte z [python.org](https://www.python.org/downloads/)
2. Zaškrtněte "Add Python to PATH" při instalaci
3. Restartujte terminál

### Chyba při aktivaci venv (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port 5000 je obsazený
V `app_main.py` změňte port:
```python
app.run(host='0.0.0.0', port=8080, debug=True)
```

## 🔥 Pokročilé použití

### Vývojový režim s auto-reload
```bash
export FLASK_ENV=development  # Linux/macOS
$env:FLASK_ENV="development"  # Windows PowerShell
python app_main.py
```

### Produkční nasazení
Pro produkci použijte WSGI server:
```bash
pip install gunicorn  # Linux/macOS
gunicorn -w 4 -b 0.0.0.0:5000 app_main:app
```

Windows použijte `waitress`:
```bash
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 app_main:app
```

---

**Máte problém?** Otevřete [Issue](../../issues/new/choose) a rádi pomůžeme! 💪
