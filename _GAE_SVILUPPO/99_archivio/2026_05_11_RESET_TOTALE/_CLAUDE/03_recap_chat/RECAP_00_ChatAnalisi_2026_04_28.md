# RECAP_00_ChatAnalisi — Sessione 2026_04_28
> Aggiornato: 2026_04_28_1900
> Tipo chat: Chat di Analisi (coordinamento globale, senza numero)
> Stato: ✅ Sessione chiusa
> Protocolli emessi: F1-INFRA-001, F1-INFRA-001-bis, F1-INFRA-002 (tutti ✅)

---

## 1. SCOPO E PERIMETRO

Sessione di coordinamento globale della Chat di Analisi (senza numero).
Questa chat non emette protocolli operativi per singoli moduli — produce
decisioni architetturali, riorganizzazioni di sistema, e RECAP per le
altre chat. Non confonderla con le chat operative.

In questa sessione specifica: setup completo del sistema MCP filesystem
tra Claude Desktop e Antigravity, riorganizzazione totale della cartella
`_GAE_SVILUPPO/`, standardizzazione dei RECAP, aggiornamento Rules/Workflows
di AG, decisione di lavorare solo in modalità MCP senza sync Progetto Claude.

---

## 2. DECISIONI PRESE IN QUESTA SESSIONE

### Decisione 1 — Integrazione MCP Filesystem ✅
- Claude Desktop ora ha accesso diretto a `_GAE_SVILUPPO/` via MCP server `stargem-scambio`
- Path configurato: `/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO`
- Configurazione: `claude_desktop_config.json` con `@modelcontextprotocol/server-filesystem`
- Test superato: listato correttamente `02_moduli_analisi/` con 8 file

### Decisione 2 — Struttura cartelle `_CLAUDE/` + `_ANTIGRAVITY/` ✅
Riorganizzazione totale della cartella di scambio. Struttura finale:
```
_GAE_SVILUPPO/
├── 00_LEGGIMI.md                    ← regole permanenti (12 regole)
├── _CLAUDE/                         ← territorio Claude
│   ├── 01_canonici/                 (MASTER_STATUS, ANALISI_MASTER)
│   ├── 02_moduli_analisi/           (H_Piano_Pagamenti, I_Checklist_Globale)
│   ├── 03_recap_chat/               (10 RECAP + _TEMPLATE_RECAP.md)
│   └── 04_per_antigravity/          (prompt e protocolli per AG)
├── _ANTIGRAVITY/                    ← territorio Antigravity
│   ├── 01_status_continui/          (A→G+Z a nome fisso)
│   ├── 02_output_protocolli/        (audit, report Stop&Go)
│   └── 03_codice_in_lettura/        (snapshot codice temporanei)
└── 99_archivio/                     (versioni vecchie con timestamp)
```

### Decisione 3 — Nome fisso per i file vivi (no timestamp nel nome) ✅
- I file di AG in `01_status_continui/` usano nome fisso (es. `A_Architettura_Core_Server.md`)
- I RECAP in `03_recap_chat/` usano nome fisso (es. `RECAP_08_Corsi.md`)
- Prima di sovrascrivere: copia in `99_archivio/` con timestamp `YYYY_MM_DD_HHMM_`
- Versioni vecchie con timestamp già archiviate in `99_archivio/`

### Decisione 4 — Solo MCP, nessuna sync col Progetto Claude ✅
- Gaetano lavora ESCLUSIVAMENTE da Claude Desktop con MCP attivo
- Il Progetto Claude (project knowledge su claude.ai) NON viene più sincronizzato
- Se Claude aperto da browser/mobile: avviso immediato che i dati potrebbero essere vecchi
- Check inserito nelle istruzioni del Progetto Claude

### Decisione 5 — Formato RECAP standard a 9 sezioni ✅
Template fisso creato in `_CLAUDE/03_recap_chat/_TEMPLATE_RECAP.md`:
1. SCOPO E PERIMETRO
2. STATO ATTUALE (fatto / in corso / bloccato)
3. TABELLE DB COINVOLTE
4. FILE CHIAVE NEL CODEBASE
5. DECISIONI ARCHITETTURALI APERTE
6. PROTOCOLLI ESEGUITI (F1/F2)
7. PENDENTI (in ordine di priorità)
8. INTERSEZIONI CON ALTRE CHAT
9. NOTE PER LA PROSSIMA SESSIONE

### Decisione 6 — 27 chat (non 23) ✅
Elenco ufficiale aggiornato:
```
01_quote_e_promozioni     15_Saggi
02_GemStaff               16_VacanzeStudio
03_GemTeam                17_Clarissa
04_MedGem                 18_GemEvent
05_GemPass                19_GemNight
06_contabilita            20_MerchSG
07_Gemory                 21_TeoCopilot
08_corsi                  22_Import_Export_dati
09_workshop               23_Log_per_verifiche
10_utenti_GemPortal       24_DB_Monitor
11_Campus                 25_Knowledge_Base
12_Gemdario               26_Dashboard
13_Domeniche_in_Movimento 27_TV_e_pubblicita
14_BookGem
+ Chat di Analisi (senza numero)
```

### Decisione 7 — Regola comunicazione tra chat ✅
Il file è l'unico canale. Tutto ciò che una chat deve comunicare alle altre
va scritto in un file di `_GAE_SVILUPPO/`. Quello che resta in conversazione
è invisibile alle altre chat.

---

## 3. PROTOCOLLI ANTIGRAVITY ESEGUITI

### F1-INFRA-001 — Analisi riorganizzazione GAE_SVILUPPO
- Inventario completo dei file esistenti (8 file A→G+Z + sottocartelle `attuale/` e `futuro/`)
- Verifica stato git (file untracked dopo rename manuali)
- Mappatura proposta: tutti i file in `02_moduli_analisi/`
- Proposta contenuto `00_LEGGIMI.md`
- Elenco comandi previsti

### F1-INFRA-001-bis — Esecuzione riorganizzazione
- Creazione struttura 7 sottocartelle (inclusa `01_canonici/` con `.gitkeep`)
- Spostamento 8 file A→G+Z in `02_moduli_analisi/` (via Node.js script)
- Scrittura `00_LEGGIMI.md` con contenuto esatto concordato
- `git add -A _GAE_SVILUPPO/` per allineamento index git
- Rimozione `.DS_Store` e `rmdir` di `attuale/` e `futuro/`

### F1-INFRA-002 — Migrazione alla struttura finale _CLAUDE/_ANTIGRAVITY
**Fase A** — rm -rf delle 6 cartelle vecchie (01_canonici, 02_moduli_analisi, 03_recap_chat, 04, 05, 06)
**Fase B** — Rules: aggiornamento `studiogem-rules.md`:
- Regola 5 riscritta: nome fisso + backup in 99_archivio/ pre-sovrascrittura
- Regola 6 riscritta: territori severi, abolito limite 10 file
- Regola 12 aggiornata: path nuovo per D_Mappa_Dati_e_Frontend.md
- Regola 13 aggiunta: lettura inizio sessione obbligatoria
**Fase C** — 3 Workflows aggiornati con direttiva esplicita su nuovi territori
**Fase D** — `git add -A _GAE_SVILUPPO/ .agents/` senza commit

---

## 4. LAVORO ESEGUITO DA CLAUDE VIA MCP

### File CREATI in _CLAUDE/03_recap_chat/
- `_TEMPLATE_RECAP.md` (formato standard 9 sezioni)
- `RECAP_02_GemStaff.md` — ✅ Completata, F1-016/F2-019
- `RECAP_04_MedGem.md` — 🔴 Da iniziare, 6 tabelle da creare
- `RECAP_05_GemPass.md` — 🟡 Fase 2 da partire, F1-007/F2-007
- `RECAP_06_Contabilita.md` — 🔴 Da iniziare, delta payments +8.287 da chiarire
- `RECAP_07_Gemory.md` — 🔴 Da iniziare, 5 decisioni aperte
- `RECAP_08_Corsi.md` — 🟡 Briefing pronto, audit DB priorità ZERO
- `RECAP_10_Utenti.md` — 🟡 Fase 2 da partire, F1-014/F2-012
- `RECAP_12B_Gemdario.md` — 🟡 In collaudo, deploy F2-034→040 pendente
- `RECAP_22_ImportExportBonifica.md` — ✅ Completata, entrambe le fasi
- `RECAP_24_DBMonitor.md` — 🟡 In pausa, audit completato 28/04

### File CREATI in _ANTIGRAVITY/01_status_continui/ (nome fisso)
A_Architettura_Core_Server.md, B_Frontend_Moduli.md, C_Stato_Lavori_e_Briefing.md,
E_Espansione_CRM.md, F_ULTIMI_AGGIORNAMENTI.md, G_Checklist_Operativa.md,
Z_REPORT_CLEANUP_DB.md (D spostato direttamente con move_file)

### File CREATI in _CLAUDE/02_moduli_analisi/
- `H_Piano_Integrazione_Pagamenti_Omnichannel.md` (documento strategico 12/04)
- `I_Checklist_Globale.md` (checklist trasversale 26/04)

### Check di coerenza eseguito
4 incoerenze DB trovate tra 25/04 e 28/04 (segnalate nei RECAP):
- `members`: 4.489 → 4.918 (+429) — non documentato
- `payments`: 3.775 → 12.062 (+8.287) — non documentato
- `enrollments`: 13.584 → 12.234 (−1.350) — non documentato
- `courses`: 586 → 602 (+16) — non documentato

---

## 5. CONFIGURAZIONE FINALE

### claude_desktop_config.json
```json
{
  "mcpServers": {
    "stargem-scambio": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO"]
    }
  }
}
```

### Istruzioni Progetto Claude — punti chiave aggiornati
- Check MCP disponibile o avviso browser all'inizio di ogni sessione
- Lettura ordinata nuovi path `_CLAUDE/` + `_ANTIGRAVITY/`
- Nessun rituale di sync (decisione MCP-only)
- Lista 27 chat aggiornata

### Rules AG (studiogem-rules.md) — punti chiave
- Regola 5: nome fisso + backup pre-sovrascrittura in 99_archivio/
- Regola 6: territori severi, nessun limite file
- Regola 12: path aggiornato D_Mappa_Dati_e_Frontend.md
- Regola 13 (nuova): lettura obbligatoria inizio sessione

---

## 6. PENDENTI — prossime sessioni

### Alta priorità
1. **Audit 4 delta DB** — F1-001 READ-ONLY in Chat_08_Corsi (già avviata)
2. **MASTER_STATUS aggiornato** — portare da 23 a 27 chat + registrare sessione di oggi
3. **ANALISI_MASTER aggiornato** — portare da 23 a 27 chat

### Media priorità
4. **17 RECAP mancanti** da creare:
   Chat_01, 03, 09, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27
5. **Backup filesystem** — Time Machine o Drive (il Progetto Claude non è più rete di sicurezza)

### Bassa priorità
6. Aggiungere `*.DS_Store` a `.gitignore`
7. Decidere se committare la riorganizzazione `_GAE_SVILUPPO/` + `.agents/`

---

## 7. NOTE TECNICHE DA RICORDARE

- **Path assoluto GAE_SVILUPPO**: `/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO`
- **Utente Mac**: `gaetano1`
- **MCP server name**: `stargem-scambio`
- **SMTP**: funziona solo su VPS (porta 465 SSL) — relay locale bloccato da IONOS
- **`street_address`**: ghost column in `members` (DROP impossibile per row size limit MariaDB 8126 byte)
- **`user_roles.name`**: nome corretto della colonna (NON `roleName`)
- **`members.user_id`**: FK varchar(255) → `users.id` (onDelete: set null)
- **Formato tessera**: `2526-000042` (con trattino)
- **3 SKU NON toccare**: `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA`
- **`payments` MAI DROP** — solo ADD COLUMN (PaymentModuleConnector: 14 route)
- **Smart Routing**: QUOTATESSERA → memberships, DTYURI/DTNELLA → medical_certificates
- **Stagione attiva**: 25/26 (`season_id=1`)
- **DB**: `stargem_v2` (MariaDB 11.4, SSH tunnel porta 3307)
- **VPS**: IONOS Ubuntu 24.04, deploy via Plesk (MAI da AG)
- **Git**: branch `main`, ahead di 2 commit, cleanup non committato

---

## 8. PROMPT PRONTI

### Apertura Chat_08_Corsi operativa (già girata a fine sessione)
```
Apri Chat_08_Corsi del progetto StarGem Suite.

Le istruzioni del Progetto ti diranno cosa leggere all'inizio. Quando hai
finito la lettura ordinata (00_LEGGIMI, MASTER_STATUS, ANALISI_MASTER,
RECAP_08_Corsi.md, RECAP delle chat correlate sezione 8), procedi:

PRIORITÀ ZERO: capire i 4 delta DB tra 25/04 e 28/04:
- enrollments: 13.584 → 12.234 (−1.350)
- members: 4.489 → 4.918 (+429)
- payments: 3.775 → 12.062 (+8.287)
- courses: 586 → 602 (+16)

Genera F1-001 per AG-Backend: audit READ-ONLY sulle 4 tabelle.
Output: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F1-001_2026_04_28.md

A fine sessione: aggiorna RECAP_08_Corsi.md + 4 campi MASTER_STATUS.
```

---

*Scritto da: Claude (Chat di Analisi) — sessione del 28 aprile 2026*
*Chat eliminata dopo la scrittura di questo file.*
*Destinazione file: _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_00_ChatAnalisi_2026_04_28.md*
