# Plán vylepšení rezervačního systému

## Priorita 1: Kritické opravy

### 1.1 Oprava logiky kontroly kolizí
- Přepsat check_collision funkci pro správnou kontrolu na úrovni zařízení
- Přidat podporu pro speciální případy (TisNg Hybrid - PNEUMATIKA)
- Zlepšit validaci vstupních dat

### 1.2 Bezpečnostní vylepšení
- Přidat input validaci na backend
- Implementovat proper error handling
- Přidat logging pro debug účely

## Priorita 2: UX vylepšení

### 2.1 Vylepšení formuláře
- Umožnit editaci existujících rezervací
- Přidat bulk operace (mazání více rezervací najednou)
- Zlepšit handling rezervací zabírajících oba prostory

### 2.2 UI vylepšení
- Přidat loading stavy
- Vylepšit error zprávy
- Přidat potvrzovací dialogy

## Priorita 3: Nové funkce

### 3.1 Export/Import
- Export rezervací do Excel/CSV
- Import z Excel
- Backup/restore funkcionalita

### 3.2 Pokročilé funkce
- Filtry a vyhledávání
- Notifikace (email alerts)
- Multi-user support

## Implementační postup

1. Nejprve opravit kritické chyby
2. Postupně implementovat UX vylepšení
3. Přidat nové funkce dle potřeby
