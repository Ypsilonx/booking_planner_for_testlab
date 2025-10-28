# FAQ - Často kladené otázky

## 📌 Obecné

### Co je Booking Planner for Test Lab?
Webová aplikace pro správu rezervací testovacího laboratoře s podporou kapacitního managementu, blocker rezervací a TMA čísel projektů.

### Je aplikace zdarma?
Ano, projekt je open-source pod MIT licencí. Můžete jej používat i upravovat zdarma.

### Podporuje více uživatelů současně?
Ano, díky SQLite databázi mohou pracovat více uživatelů najednou. Pro vysokou zátěž doporučujeme migraci na PostgreSQL nebo MySQL.

## 🛠️ Instalace a konfigurace

### Jaké jsou minimální požadavky?
- Python 3.8 nebo novější
- 50 MB volného místa
- Moderní webový prohlížeč

### Musím používat virtuální prostředí?
Není to povinné, ale **silně doporučujeme** pro izolaci závislostí a prevenci konfliktů.

### Jak změním port aplikace?
V `app_main.py` na posledním řádku změňte `port=5000` na váš požadovaný port.

### Kde se ukládají data?
Data jsou v SQLite databázi `booking_planner.db` v kořenovém adresáři projektu.

### Jak přenést aplikaci na jiný počítač?
1. Zkopírujte celý projekt
2. Nainstalujte závislosti: `pip install -r requirements.txt`
3. Databáze se přenese automaticky (soubor `booking_planner.db`)

## 🔧 Používání

### Co je "blocker" rezervace?
Blocker rezervace blokuje zařízení, ale **nespotřebovává kapacitu**. Používá se např. pro údržbu nebo dlouhodobé rezervace.

### Jak funguje detekce kolizí?
Systém kontroluje, zda se rezervace nepřekrývají v čase a zda není překročena kapacita zařízení. Blocker rezervace se nepočítají do kapacity.

### Co je TMA číslo?
TMA číslo je identifikátor projektu ve formátu `EU-SVA-123456-25`. Aplikace jej automaticky extrahuje z popisů při migraci.

### Jak upravit kapacitu zařízení?
1. Klikněte na tlačítko "Equipment Management"
2. Double-click na zařízení
3. Změňte `max_tests` na požadovanou kapacitu

### Mohu exportovat data?
Aktuálně ne, ale je to v plánu. Můžete zatím kopírovat soubor `booking_planner.db` nebo použít SQL dotazy.

## 🐛 Řešení problémů

### Aplikace se nespustí - "Address already in use"
Port 5000 je obsazený. Změňte port v `app_main.py` nebo zastavte proces na portu 5000.

### Chyba: "No module named 'flask'"
Nebyly nainstalovány závislosti. Spusťte: `pip install -r requirements.txt`

### Databáze je prázdná po spuštění
Spusťte migrační script: `python db_init.py`

### Rezervace se neuloží
1. Zkontrolujte konzoli prohlížeče (F12) pro chyby
2. Zkontrolujte terminál serveru pro Python chyby
3. Ověřte že máte oprávnění k zápisu do databáze

### Jak resetovat databázi?
Smažte soubor `booking_planner.db` a spusťte `python db_init.py` znovu.

## 🔒 Bezpečnost

### Je aplikace bezpečná pro produkci?
Základní verze **není** připravena pro veřejný internet. Pro produkci:
- Přidejte autentifikaci
- Povolte HTTPS
- Použijte produkční WSGI server (gunicorn/waitress)
- Pravidelně zálohujte databázi

### Podporuje HTTPS?
Základní Flask development server ne. Pro HTTPS použijte reverse proxy (nginx) nebo WSGI server s SSL.

### Jak zabezpečit přístup?
Můžete přidat:
- HTTP Basic Auth
- Flask-Login pro uživatelské účty
- OAuth2 pro externí autentifikaci

## 📊 Výkon

### Kolik rezervací aplikace zvládne?
SQLite zvládne tisíce rezervací. Pro desítky tisíc doporučujeme PostgreSQL.

### Můžu používat jinou databázi než SQLite?
Ano, ale vyžaduje to úpravu kódu. SQLite je ideální pro malé až střední nasazení.

### Aplikace je pomalá, co dělat?
1. Zkontrolujte velikost databáze
2. Přidejte indexy na časté dotazy
3. Zvažte použití Redis pro cache
4. Pro velké nasazení přejděte na PostgreSQL

## 🤝 Přispívání

### Jak mohu přispět?
Přečtěte si [CONTRIBUTING.md](CONTRIBUTING.md) pro detailní informace.

### Našel jsem chybu, co mám dělat?
Vytvořte [Issue](../../issues/new/choose) s popisem problému.

### Mám nápad na novou funkci
Super! Vytvořte Feature Request Issue a popište váš nápad.

## 📞 Podpora

### Kde získám pomoc?
1. Projděte tuto FAQ
2. Přečtěte si [README.md](README.md)
3. Vyhledejte v [Issues](../../issues)
4. Vytvořte nový Issue

### Mohu aplikaci používat komerčně?
Ano, MIT licence to umožňuje.

---

**Nenašli jste odpověď?** Otevřete [Issue](../../issues/new/choose) s otázkou! 🙋
