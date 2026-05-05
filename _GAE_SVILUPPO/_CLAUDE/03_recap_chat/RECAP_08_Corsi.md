# RECAP COMPLETO — Chat_08_Corsi + Setup Bridge MCP
# Periodo: 29 aprile 2026 → 03 maggio 2026
# Questa chat può essere eliminata dopo l'archiviazione di questo documento.

---

## 1. CONTESTO E SCOPO DI QUESTA CHAT

**Progetto:** StarGem Suite — gestionale SaaS per SSDRL italiane  
**Cliente:** Geos SSDRL — Studio Gem Milano  
**Chat:** 08_Corsi (modulo iscrizioni, attività, schede dettaglio)  
**Periodo copertura:** 29/04/2026 ore 14:58 → 03/05/2026 ore 18:30  
**Protocolli chiusi:** 31 totali (18 backend F1 + 23 frontend F2)  
**Evento straordinario in questa chat:** scoperta e risoluzione definitiva del problema scrittura file MCP (bridge Python custom installato e inaugurato)

---

## 2. RISULTATI OPERATIVI CHAT_08_CORSI

### 2.1 Pagine lista /iscritti_per_attivita
- **6 tab accordion canonici** (Workshop / Corsi / Allenamenti / Domeniche / LI / Campus)
- Toggle smart unificato in alto a destra (label dinamica "Espandi tutto / Comprimi tutto")
- Dropdown stagioni con `getSeasonLabel` (Attuale → Successiva → Precedente + Tutte)
- Schede CHIUSE di default, apertura singola controllata dall'utente
- Componente `ActivityAccordionCard` riutilizzabile

### 2.2 Pagine /attivita/*
- Tile alti SEMPRE da `/api/activities-summary` (single source of truth)
- Filtro stagione default = active (configurabile via `?seasonId=NN` o `?seasonId=all`)
- Endpoint `/api/workshops` fix: non esisteva → sostituito con `/api/courses?activityType=workshop`
- Magic strings bonificate: `domeniche→domenica_movimento`, `prenotazioni→lezione_individuale`
- Contatore Popover in `ActivityManagementPage` (ordine bottoni: Esporta CSV → Popover N → Nuovo X)

### 2.3 Pagine wrapper /attivita/<tipo>
- 5 pagine wrapper allineate: `sunday-activities`, `individual-lessons`, `trainings`, `campus-activities`, `workshops`
- `ActivityManagementPage` con prop `idParamName?: string` (default "activityId")
- Pagine ad hoc passano `idParamName="courseId"`

### 2.4 Schede dettaglio (5 file canonici)
- **scheda-corso.tsx** — RIFERIMENTO CANONICO
- **scheda-allenamento.tsx** — allineata canonico + anti-crash 2526ALLENAMENTO
- **scheda-domenica.tsx** — campi specifici (data, tipo, insegnante, sala) + placeholder NULL
- **scheda-lezione-individuale.tsx** — campi specifici (insegnante, giorno/ora, sala) + placeholder NULL
- **scheda-campus.tsx** — campi specifici (settimana, minore, genitore) + placeholder NULL

**Pattern canonico per tutte le schede:**
- URL param: `?courseId=N`
- Endpoint: `/api/courses` + `/api/courses/:id/enrolled-members`
- Data mapping: FLAT (`data.first_name`, `data.medical_expiry_date`, `data.presenze_count`)
- Anti-crash contenitori generici: early return su `sku === '2526ALLENAMENTO'` o `sku.startsWith('2526GENERICO')`
- Placeholder NULL: `<span class="text-muted-foreground italic">— Da popolare</span>` + tooltip + commento `// TODO Chat_Analisi:`

### 2.5 Backend
- Endpoint `/api/dashboard/attivita-panoramica` creato (F1-019): restituisce Risorse + Stagione; Oggi e SaluteDati = null predisposti
- 2 corsi DT (DTYURI ID 551 + DTNELLA ID 554) → `activity_type='visita_medica'` (F1-013-LIGHT)
- 1011 enrollments spostati da lezione_individuale a visita_medica
- Backup: `CHAT08_F1013LIGHT_PRE_UPDATE_DT_20260429.sql`

### 2.6 Numeri DB post-sessione
- `courses`: 602 totali (314 stagione 25/26 attivi, 294 pubblicati)
- `enrollments`: 12.234
- `members`: 4.918
- `memberships`: 3.305
- `medical_certificates`: 2.867
- `studios`: 13/13 attive
- `payments`: 3.775

---

## 3. PROTOCOLLI ESEGUITI

### Backend (F1) — 18 protocolli
| Protocollo | Descrizione |
|---|---|
| F1-003 | Cleanup fase1 — bonifica tabelle attivita/universal_enrollments |
| F1-004 | Audit conteggi |
| F1-006 | Audit corsi 25/26 dedicato |
| F1-007 | Audit tile panoramica iscritti |
| F1-008 | Bonifica courses massiva |
| F1-009 | Audit duplicazione massiva |
| F1-010 | Delete corsi fantasma |
| F1-011 | Audit cellulare schede attivita |
| F1-012 | Audit LI 38 vs 1049 |
| F1-013-LIGHT | 2 corsi DT (DTYURI+DTNELLA) → activity_type=visita_medica |
| F1-014 | Audit /attivita/* disallineate (magic strings sbagliate, endpoint /api/workshops inesistente) |
| F1-015 | Bonifica magic strings + fix endpoint workshop + filtro stagione activities-summary |
| F1-016 | Audit comprensivo incongruenze /attivita/* |
| F1-017 | 3 fix numeri: tile alti from summary, mapping LI, iscritti dinamici da enrollments |
| F1-018 | Audit cruscotto Panoramica (preparazione F1-019) |
| F1-019 | Endpoint /api/dashboard/attivita-panoramica (Risorse + Stagione) |
| F1-020 | Audit endpoint scheda dettaglio (identificato anti-pattern "data dump globale") |
| F1-021 | Audit DB campi 3 schede (Domeniche/LI/Campus) — molti NULL nei record reali |

### Frontend (F2) — 23 protocolli
| Protocollo | Descrizione |
|---|---|
| F2-001/002/003 | Setup tab Workshop accordion + uniformazione contatore |
| F2-004 | Audit bottone card calendario |
| F2-006/007 | Endpoint Panoramica + tab Corsi accordion |
| F2-008 | Fix foglio bianco (props ActivityAccordionCard) |
| F2-009 | Audit workshop tab produzione |
| F2-010 | Fix bottone Crea Copia |
| F2-012 | Workshop contatore badge |
| F2-013 | Panoramica unificata |
| F2-014/015/016/017 | Tab Domeniche/LI/Allenamenti/Campus accordion |
| F2-018b/018c | Uniformità Domeniche+LI, uniformità dropdown stagioni 5 tab |
| F2-019 | Audit badge cambia al click (esecuzione rinviata — decisione A/B aperta) |
| F2-022 | Toggle unificato + dropdown calendario getSeasonLabel |
| F2-024 | Contatore Popover in ActivityManagementPage + fix Schede Workshop/Allenamenti rotte |
| F2-025 | Posizione contatore + scheda-allenamento allineata canonico |
| F2-026 | 3 schede ad hoc (Domenica/LI/Campus) + bug 2526ALLENAMENTO |
| F2-027 | Fix pagine bianche (data mapping nested→flat, causa principale) |
| F2-028 | Anti-crash 2526ALLENAMENTO + riallineamento data flat scheda-allenamento |

---

## 4. VERIFICHE FRONTEND CONFERMATE

Tutte verificate nel browser dopo hard refresh (Cmd+Shift+R):

- ✅ /iscritti_per_attivita (6 tab accordion + dropdown calendario + toggle unico)
- ✅ /attivita Panoramica (Tile Workshop = 18, Riepilogo basso allineato stagione)
- ✅ /attivita/corsi (314/294, contatore +14% stagione)
- ✅ /attivita/workshops (18 attive, click Scheda funzionante)
- ✅ /attivita/allenamenti (2 schede + 154 iscritti, click Scheda funzionante per ALL-CUGGE-PACC100)
- ✅ /attivita/domeniche-movimento (13 schede + 96 iscritti, click Scheda funzionante)
- ✅ /attivita/lezioni-individuali (1 scheda + 38 iscritti)
- ✅ /attivita/campus (4 schede + 68 iscritti, anagrafica minore + genitore)
- ✅ Click 2526ALLENAMENTO mostra "Nessun dato relazionale per contenitore generico"
- ✅ Tutte le 5 schede dettaglio aprono senza pagina bianca
- ✅ Placeholder TODO Chat_Analisi visibili sui campi NULL

---

## 5. DECISIONI ARCHITETTURALI PRESE

### ✅ Chiuse
1. **Pattern dropdown stagioni:** `getSeasonLabel` da `client/src/lib/utils.ts`, 3 voci ordinate + Tutte
2. **Pattern toggle Espandi/Comprimi:** unico smart in alto a destra, label dinamica
3. **Routing schede ad hoc:** `?courseId=N`, endpoint `/api/courses` + `/api/courses/:id/enrolled-members`
4. **TODO Chat_Analisi placeholder:** convenzione UI + commento `// TODO Chat_Analisi:` + tooltip

### 🔴 Rinviate
5. **Refactor Schede unificato (Scenario 1 ibrido F1-020):** creare `/api/courses/:id` ricco backend + 1 file `course-detail.tsx` unico → eliminare 6 file `scheda-*.tsx`. Effort 6h. Sessione dedicata futura.
6. **Cruscotto Panoramica frontend (F2-020):** backend pronto (F1-019), frontend da fare con 4 tab interni (Oggi / Risorse / SaluteDati / Stagione). Layout A scelto.

---

## 6. PENDENTI PER PROSSIME SESSIONI CHAT_08

### Alta priorità
1. **F2-019 esecuzione** — fix UX badge cambia al click (decisione A=rimuovi onClick / B=badge statico+checkbox separato)
2. **F2-020 cruscotto Panoramica frontend** — 4 tab interni, consumo endpoint F1-019
3. **F2-? colonna Cellulare** — 8 schede + endpoint backend (F1-011 audit pronto)

### Media priorità
4. **Refactor Schede unificato** (Scenario 1 ibrido F1-020): Effort 6h totali
5. **TAB 1 OGGI cruscotto** (lezioni in corso ora, sale occupate, insegnanti in turno) — 1h backend
6. **TAB 3 SALUTE DATI cruscotto** (regole logiche: tessere mancanti, CF mancanti, certificati scaduti) — 1.5h backend

### Bassa priorità
7. `participation_type` uniformazione ('corso' vs 'STANDARD_COURSE')
8. Badge status iscrizione UI (active/pending/cancelled)
9. Filtri UI per stagione, status, tipo

---

## 7. COMUNICAZIONI ALLE ALTRE CHAT

### → Chat_22b/Bonifica
- 2 record fantasma: id 465 "Salsa" (sku NULL) + id 466 "Total Body" (sku IND-ALMEIDA-MER08), activity_type='prenotazioni', 0 iscritti → eliminabili o spostare a lezione_individuale
- 586 corsi rimanenti da riclassificare
- Popolare campi NULL nei record Domeniche/LI/Campus: `courses.start_date`, `courses.end_date`, `courses.instructor_id`, `courses.studio_id`, `courses.start_time`, `courses.end_time`
- Audit dettagliato in: `audit_F1-021_db_campi_3schede_2026_04_29.md`

### → Chat_04/MedGem
- 2 corsi DT spostati a `activity_type='visita_medica'` (DTYURI ID 551 + DTNELLA ID 554)
- 1011 enrollments correlati spostati
- Candidati per tab dedicata in /medgem
- Backup pre-operazione: `CHAT08_F1013LIGHT_PRE_UPDATE_DT_20260429.sql`

### → Chat_10/Utenti
- `members.father_first_name` + `mother_first_name` USATI in scheda-campus.tsx
- `members.is_minor` + `dateOfBirth` → età calcolata in scheda-campus

### → Chat_11/Campus
- `scheda-campus.tsx` esiste con campi minore + genitore + settimana
- TODO: pasti/extra Campus (DB structure mancante)
- TODO: gruppo bambino (DB structure mancante o courses.level)
- TODO: popolare records Campus in DB con start/end date e orari giornalieri

### → Chat_13/Domeniche
- `scheda-domenica.tsx` esiste con anagrafica + data + tipo + insegnante + sala
- TODO: stato presenze domenica (struttura attendances o dedicata)
- TODO: popolare records Domeniche in DB con start_date/instructor_id/studio_id

### → Chat futura LI dedicata (da creare)
- `scheda-lezione-individuale.tsx` esiste con anagrafica + insegnante + giorno/ora + sala
- TODO: tabella packages (pacchetto LI + lezioni residue)
- TODO: endpoint prossima lezione prenotata
- TODO: storico lezioni su attendances

### → Chat_26/Dashboard
- Promemoria tema dark/light/auto (Regola 16)
- Pattern endpoint `/api/dashboard/attivita-panoramica` riutilizzabile

### → Chat_Analisi
- TODO grep cercabili: `grep -rn "TODO Chat_Analisi" client/src/pages/scheda-*.tsx`
- Smistamento di ogni TODO alla chat operativa dedicata
- Decisione architetturale rinviata: Refactor Schede unificato

---

## 8. FILE CANONICI — STATO AL MOMENTO DELLA CHIUSURA DI QUESTA CHAT

### ⚠️ ATTENZIONE CRITICA
I 3 file canonici qui sotto sono stati GENERATI da Claude in chat ma NON salvati sul disco.
Il problema è stato scoperto e risolto con il bridge MCP (vedi sezione 9).
Questi file esistono SOLO nel sandbox container di Claude e sono persi quando la chat viene eliminata.
**DEVONO essere riscritti in una nuova chat che usa stargem-writer.**

### File da recuperare (contenuto qui di seguito)

---

### 📄 RECAP_08_Corsi.md (da scrivere in nuova chat)
Percorso: `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_08_Corsi.md`
Attualmente sul disco: versione del 28/04/2026 (NON aggiornata)
Versione generata in questa chat: completa con 31 protocolli, 10 sezioni

Contenuto: vedi RECAP_08 completo che Claude ha generato in questa chat.
Tutti i dati sono in questo documento (sezioni 2-7 sopra).

---

### 📄 MASTER_STATUS.md (da scrivere in nuova chat)
Percorso: `_GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md`
Attualmente sul disco: versione del 26/04/2026 (NON aggiornata con sezione Chat_08)
Cambiamenti necessari:
- Aggiungere sezione Chat_08 con 31 protocolli sessione 29-30/04
- Aggiungere Regola 15 (intestazione prompt AG)
- Aggiungere Regola 16 (tema dark/light/auto futuro)
- Aggiornare numeri DB: courses=602 (2 DT→visita_medica), enrollments=12.234

---

### 📄 ANALISI_MASTER.md (da scrivere in nuova chat)
Percorso: `_GAE_SVILUPPO/_CLAUDE/01_canonici/ANALISI_MASTER.md`
Attualmente sul disco: v5.0 del 25/04/2026 (NON aggiornata)
Versione generata: v6.0 con:
- Regola 15 (intestazione prompt AG)
- Regola 16 (tema dark/light/auto futuro)
- Mappa 26 chat aggiornata (Chat_08 ora ✅ con 31 protocolli)
- Sezione 14 (Regole Globali)
- Sezione 15 (Pattern Tecnici Consolidati A→E)

---

### ✅ File canonici CORRETTAMENTE SUL DISCO (aggiornati da AG)
Questi sono stati salvati da Antigravity (AG-F1 + AG-F2) e sono corretti:
- `_ANTIGRAVITY/01_status_continui/A_Architettura_Core_Server.md` (AG-F1, 30/04)
- `_ANTIGRAVITY/01_status_continui/B_Frontend_Moduli.md` (AG-F2, 30/04)
- `_ANTIGRAVITY/01_status_continui/C_Stato_Lavori_e_Briefing.md` (AG-F1+F2, 30/04)
- `_ANTIGRAVITY/01_status_continui/D_Mappa_Dati_e_Frontend.md` (AG-F2, 30/04)
- `_ANTIGRAVITY/01_status_continui/F_ULTIMI_AGGIORNAMENTI.md` (AG-F1+F2, 30/04)
- `_ANTIGRAVITY/01_status_continui/G_Checklist_Operativa.md` (AG-F1+F2, 30/04)
- `_ANTIGRAVITY/01_status_continui/Z_REPORT_CLEANUP_DB.md` (AG-F1, 30/04)

---

## 9. SCOPERTA E RISOLUZIONE PROBLEMA MCP SCRITTURA

### 9.1 Il problema
`create_file` di Claude (tool del sandbox container Linux) risponde "File created successfully" ma scrive in `/home/claude` nel container, NON sul Mac di Gaetano. Il filesystem del container Claude e il filesystem del Mac sono completamente separati.

**Effetto pratico:** tutti i file canonici che Claude "scriveva" in questa chat erano fantasmi — visibili solo nel container, persi alla chiusura della chat.

### 9.2 Diagnosi tecnica
1. Server MCP `stargem-scambio` usa `@modelcontextprotocol/server-filesystem` ufficiale
2. Il server espone 15 tool (4 read-only + 7 write/edit)
3. **Claude Desktop versione 1.5354.0** filtra e mostra solo i 4 tool read-only
4. La blocklist è hardcoded nel client — non modificabile via config JSON
5. Verificato con `echo '{"method":"tools/list"...}' | npx ... server-filesystem` → mostra tutti i 15 tool
6. La restrizione è deliberata di Anthropic per sicurezza degli utenti

### 9.3 Soluzione implementata — Bridge MCP Python custom

**Script creato:** `/Users/gaetano1/SVILUPPO/stargem_mcp_bridge/stargem_writer.py`
**Python:** 3.14.3 (`/Library/Frameworks/Python.framework/Versions/3.14/bin/python3`)
**Dimensione:** 8.133 byte
**Zero dipendenze esterne** (solo libreria standard Python)

**Tool esposti:**
- `stargem-writer:write_file` — crea o sovrascrive file
- `stargem-writer:edit_file` — edit line-based con sostituzione esatta
- `stargem-writer:create_directory` — crea cartelle annidate
- `stargem-writer:move_file` — sposta o rinomina file

**Security boundary:** il bridge verifica ogni path con `is_path_allowed()` — opera SOLO su `_GAE_SVILUPPO/`. Qualsiasi path esterno → errore immediato.

**Senza `delete_file` intenzionalmente:** i file vecchi vanno in `99_archivio/` con `move_file`, mai cancellati direttamente dal bridge.

### 9.4 Configurazione Claude Desktop

`claude_desktop_config.json` modificato aggiungendo il blocco `stargem-writer`:

```json
{
  "mcpServers": {
    "stargem-scambio": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem@latest",
        "/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO"
      ]
    },
    "stargem-writer": {
      "command": "/Library/Frameworks/Python.framework/Versions/3.14/bin/python3",
      "args": [
        "/Users/gaetano1/SVILUPPO/stargem_mcp_bridge/stargem_writer.py"
      ]
    }
  },
  "preferences": {
    "coworkWebSearchEnabled": true,
    "coworkScheduledTasksEnabled": true,
    "ccdScheduledTasksEnabled": true
  }
}
```

### 9.5 Test e inaugurazione

**Test standalone (da Terminale):**
- ✅ `tools/list` → espone 4 tool con schema JSON corretto
- ✅ `tools/call write_file` → ha scritto `_TEST_BRIDGE.md` (77 byte) su disco
- ✅ MCP read ha confermato il file scritto e il contenuto

**Test in nuova chat Claude Desktop:**
- Il file `_INAUGURAZIONE_BRIDGE.md` (184 byte) è stato creato da un nuovo Claude in nuova chat
- Verificato via MCP read: contenuto corrispondente
- `ps aux` confermato: processo Python PID 52514 running
- Settings → Sviluppatore: `stargem-writer` status **running** (verde)

### 9.6 Regola importante sul bridge

**Il bridge è visibile SOLO in chat nuove (aperte dopo 03/05/2026 ore 18:25).**
Le chat già aperte prima di quell'ora (come questa Chat_08) non vedranno mai i tool `stargem-writer:*` — i tool MCP vengono caricati una sola volta all'apertura della conversazione e non cambiano durante la sessione.

---

## 10. REGOLE EMERSE DA QUESTA CHAT

### Regola 15 — INTESTAZIONE PROMPT AG
Ogni prompt verso Antigravity deve avere come PRIMA RIGA, in maiuscolo:
```
PER AG-F1 (BACKEND)
PER AG-F2 (FRONTEND)
```
Quando si emettono 2 prompt: PRIMA F1, POI F2.

### Regola 16 — TEMA DARK/LIGHT/AUTO (futuro)
Implementare Light + Dark + Auto per tutto il gestionale in Chat_26 Dashboard. Non urgente.

### Regola 17 — BRIDGE MCP WRITER (nuova, da aggiungere al 00_LEGGIMI)
Il server `stargem-writer` espone `write_file`, `edit_file`, `create_directory`, `move_file`.
Visibile solo in chat nuove. Verifica post-scrittura obbligatoria via MCP read.
Backup in `99_archivio/` prima di sovrascrivere canonici.
No `delete_file` per design — usare `move_file` verso archivio.

### Regola permanente — VERIFY-AFTER-WRITE
Dopo ogni scrittura su file canonico: eseguire subito `stargem-scambio:read_multiple_files` e confrontare contenuto + size. Se non corrispondono → fail immediato, non procedere.

---

## 11. PATTERN TECNICI CONSOLIDATI

### Pattern A — Schede dettaglio
```
URL param: ?courseId=N
Endpoint 1: /api/courses (item)
Endpoint 2: /api/courses/:id/enrolled-members (iscritti, JOIN ricco, flat)
Data mapping: FLAT — data.first_name, data.medical_expiry_date, data.presenze_count
Anti-crash: early return se sku === '2526ALLENAMENTO' o startsWith('2526GENERICO')
Riferimento: scheda-corso.tsx
```

### Pattern B — Tab accordion /iscritti_per_attivita
```
6 tab: Workshop/Corsi/Allenamenti/Domeniche/LI/Campus
Schede CHIUSE di default
Toggle smart unico in alto a destra
Dropdown stagioni: getSeasonLabel + Tutte
```

### Pattern C — Wrapper /attivita/<tipo>
```
ActivityManagementPage con prop idParamName (default "activityId")
Pagine ad hoc (Allenamenti/Domeniche/LI/Campus) → idParamName="courseId"
Contatore Popover: DOPO "Esporta CSV", PRIMA di "Nuovo X"
```

### Pattern D — Single source of truth
```
Tile alti SEMPRE da /api/activities-summary
Filtro stagione default = active (?seasonId=NN o ?seasonId=all)
Eliminato anti-pattern data dump globale (LISTA + find frontend)
```

### Pattern E — Placeholder NULL
```
UI: <span class="text-muted-foreground italic">— Da popolare</span>
Tooltip: "Da configurare — vedi Chat_Analisi"
Commento: // TODO Chat_Analisi: <descrizione>
Smistamento: grep -rn "TODO Chat_Analisi" client/src/pages/scheda-*.tsx
```

---

## 12. INTERSEZIONI CON ALTRE CHAT

| Chat | Tipo | Contenuto |
|---|---|---|
| Chat_22b/Bonifica | ← eredità + → todo | 285 SKU pre-bonificati, 2 record fantasma da eliminare |
| Chat_04/MedGem | → comunicazione | 2 corsi DT spostati, 1011 enrollments visita_medica |
| Chat_05/GemPass | → nota | Anti-crash contenitore generico verificare per 2526QUOTATESSERA |
| Chat_06/Contabilità | → nota | 1011 enrollments visita_medica = pagamenti DT |
| Chat_10/Utenti | → dato | members.father/mother_first_name usati in scheda-campus |
| Chat_11/Campus | → todo | Pasti, gruppi, popolamento DB date |
| Chat_13/Domeniche | → todo | Presenze, popolamento DB date |
| Chat futura LI | → todo | Packages, prossima lezione, storico |
| Chat_26/Dashboard | → promemoria | Tema dark/light/auto, endpoint panoramica riutilizzabile |
| Chat_Analisi | → smistamento | TODO grep nelle schede, decisione Refactor rinviata |

---

## 13. INFRASTRUTTURA BRIDGE MCP — RIFERIMENTO OPERATIVO

### Verifica bridge attivo
```bash
ps aux | grep stargem_writer | grep -v grep
```

### Riavvio se necessario
```bash
osascript -e 'quit app "Claude"'
sleep 5
open -a Claude
```

### Path file bridge
```
Script: ~/SVILUPPO/stargem_mcp_bridge/stargem_writer.py
Config: ~/Library/Application Support/Claude/claude_desktop_config.json
Log: Settings → Sviluppatore → stargem-writer → Visualizza log
```

### Tool disponibili nelle nuove chat
- `stargem-scambio:read_multiple_files` (lettura)
- `stargem-scambio:list_directory_with_sizes` (listing)
- `stargem-scambio:list_directory` (listing)
- `stargem-scambio:list_allowed_directories` (verifica boundary)
- `stargem-writer:write_file` (scrittura)
- `stargem-writer:edit_file` (modifica)
- `stargem-writer:create_directory` (crea cartelle)
- `stargem-writer:move_file` (sposta/rinomina)

---

## 14. ISTRUZIONI PER RIPRENDERE IL LAVORO

### Prima azione nella prossima nuova chat

Scrivi questo come primo messaggio nella NUOVA chat Chat_08_Corsi:

```
Sono Gaetano. Riprendo Chat_08_Corsi di StarGem Suite.

Leggi in ordine:
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_CLAUDE/01_canonici/ANALISI_MASTER.md
4. _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_08_Corsi.md

ATTENZIONE: i file 2, 3, 4 potrebbero essere versioni vecchie 
(del 25-28 aprile) perché questa chat li ha rigenerati ma non erano 
stati scritti su disco. Controllali e dimmi se sembrano aggiornati 
(devono contenere riferimento a sessione 29-30/04/2026, 31 protocolli).

Se non sono aggiornati, dobbiamo prima recuperarli usando 
stargem-writer:write_file con il contenuto che trovi in questo 
documento di recap: RECAP_COMPLETO_CHAT08_CORSI_E_BRIDGE_MCP_29apr_03mag_2026.md
(caricato da Gaetano nel Progetto Claude).
```

### Priorità immediata quando riprendi
1. Recuperare RECAP_08, MASTER_STATUS, ANALISI_MASTER (se ancora versioni vecchie)
2. Aggiungere Regola 13/17 al `00_LEGGIMI.md` (bridge MCP writer)
3. Poi continuare con F2-019, F2-020, Refactor Schede

---

## 15. NOTE STORICHE — QUESTA SESSIONE

Questa chat ha coperto 2 argomenti distinti:

1. **Lavoro operativo Chat_08** (29-30/04): 31 protocolli chiusi, 6 tab accordion, 5 schede dettaglio, cruscotto backend, bonifica DT. Il grosso del lavoro tecnico di Chat_08.

2. **Scoperta e risoluzione problema MCP** (01-03/05): diagnosi del mancato salvataggio file su disco, identificazione della limitazione di Claude Desktop, costruzione del bridge Python custom `stargem-writer`, test empirici, inaugurazione del bridge in nuova chat. Un investimento di 4-5 ore che risolve definitivamente il problema per sempre.

**Lezione chiave:** il sistema `create_file → "File created successfully"` di Claude era silenziosamente fallace. Da oggi, ogni scrittura su file canonici richiede verifica empirica via MCP read subito dopo. Il sistema è ora affidabile solo nelle chat nuove con il bridge attivo.

---

*Recap generato: 03 maggio 2026*
*Da: Chat_08_Corsi + sessione risoluzione Bridge MCP*
*Autore: Claude (coordinatore StarGem Suite) con Gaetano Manticei*
