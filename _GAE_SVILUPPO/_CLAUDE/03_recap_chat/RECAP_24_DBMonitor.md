# RECAP_24_DBMonitor
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_27_1235)
> Stato chat: 🆕 NUOVA — briefing pronto + audit F1-001/F2-001 completati 28/04, IN PAUSA
> Ultimo protocollo: F1-001 / F2-001 (audit completato, decisioni approvate)

---

## 1. SCOPO E PERIMETRO

Modulo cruscotto interno di **monitoraggio del database** `stargem_v2`,
visibile solo a Gaetano (admin/root). Sola lettura — nessuna modifica
al DB. Funziona come mappa costante con riferimenti dettagliati per
supportare le decisioni di cleanup e architettura nelle prossime sessioni.

NON gestisce: cleanup vero e proprio (vedi Chat_25_DB_Cleanup),
audit log applicativi (vedi Chat_23_Log).

Visibile a: SOLO `role='admin'` o `role='root'`. Nessun export verso esterno.

---

## 2. STATO ATTUALE

### Cosa è già fatto
- Briefing del 27/04/2026 con requisiti completi
- F1-001 (Backend) e F2-001 (Frontend) audit completati il 28/04/2026
- Decisioni architetturali approvate (vedi sezione 5)

### Cosa è in corso
- Niente. La chat è **🟡 IN PAUSA** dal 28/04 — ripresa programmata
  nei tempi morti di lavoro su altri moduli prioritari.

### Cosa è bloccato
- L'implementazione attende il completamento dei moduli a priorità più alta
  (GemPass UI fix, Contabilità, Corsi).

---

## 3. TABELLE DB COINVOLTE

Il modulo NON crea tabelle dedicate — interroga `INFORMATION_SCHEMA`
e legge metadati da tutte le tabelle esistenti.

### Tabelle DA INTERROGARE (read-only)
- `INFORMATION_SCHEMA.TABLES` — elenco e dimensioni
- `INFORMATION_SCHEMA.COLUMNS` — colonne e tipi
- `INFORMATION_SCHEMA.KEY_COLUMN_USAGE` — foreign keys e indici
- `INFORMATION_SCHEMA.STATISTICS` — indici dettagliati
- Sample data: prime 5 righe di ogni tabella (con privacy mask)

---

## 4. FILE CHIAVE NEL CODEBASE (DA CREARE)

- `client/src/pages/admin/db-monitor.tsx` — cruscotto principale
- `client/src/components/admin/DBTableExpander.tsx` — espansione tabelle
- `client/src/components/admin/DBSchemaGraph.tsx` — grafo FK (futuro)
- `server/routes/admin/db-monitor.ts` — API admin-only
- `server/middleware/admin-only.ts` — middleware verifica ruolo
- Voce nel menu sinistra (sezione "Admin")

---

## 5. DECISIONI ARCHITETTURALI APERTE

Le seguenti decisioni sono state **APPROVATE** nell'audit F1-001/F2-001
del 28/04 ma non ancora implementate:

### Decisione 1 — Cattura modifiche AG (Strategia IBRIDA) ✅ approvata
- **Cosa decidere:** come tracciare le modifiche al DB fatte da AG
- **Decisione presa:** strategia ibrida
  - wrapper DB Pool (sempre attivo)
  - + tentativo lettura binary log se IONOS lo permette
  - fallback al wrapper puro se binary log non disponibile

### Decisione 2 — Mappa Frontend↔DB (Strategia IBRIDA) ✅ approvata
- **Decisione presa:** `db-map-config.ts` statico in RAM per lo schema
  + script di verifica notturna asincrona per non caricare il DB

### Decisione 3 — Modernizzazioni Fase 1 ✅ approvate
- Implementazione **Schema Diff** automatico
- Calcolo **Health Score** per le tabelle

### Decisione 4 — Modernizzazioni Fase 2 ✅ approvate
- Integrazione **AI Natural Query** (lettura — input testuale → SQL safe)
- **Command Palette Cmd+K** per Admin

### Decisioni APERTE residue (5 domande dalla consultazione iniziale)

1. **Refresh dei dati**: real-time (ogni X secondi) o on-demand?
   ⏳ aperta
2. **Storico modifiche**: il cruscotto deve mostrare la storia
   ("ieri questa tabella aveva N righe")? ⏳ aperta
3. **Alert automatici**: notifiche quando una tabella supera soglia
   (es. logs > 10.000 righe)? ⏳ aperta
4. **Vista sample data**: prime 5 righe di ogni tabella con privacy mask?
   ⏳ aperta
5. **Esportazione PDF/CSV** per riferimento offline? ⏳ aperta

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
- F1-001 — ✅ Audit completato 28/04 — strategia ibrida approvata

### Frontend (F2)
- F2-001 — ✅ Audit completato 28/04 — strategia ibrida approvata

I prossimi (F1-002 / F2-002) implementeranno effettivamente il modulo
quando la chat verrà ripresa.

---

## 7. PENDENTI

In ordine di priorità (alla ripresa):

1. [ ] Risposte alle 5 decisioni residue (refresh, storico, alert,
   sample data, export)
2. [ ] **F1-002** — implementazione wrapper DB Pool + endpoint INFORMATION_SCHEMA
3. [ ] **F2-002** — implementazione UI cruscotto base
4. [ ] Schema Diff automatico
5. [ ] Health Score per tabelle
6. [ ] AI Natural Query (lettura)
7. [ ] Command Palette Cmd+K
8. [ ] Indicatori visivi:
   - 🔴 Tabella orfana (non in schema.ts)
   - 🟡 Tabella vuota ma in schema.ts
   - 🟢 Tabella popolata e attiva
   - ⚠️ Tabella backup (nome contiene `_backup_`)
   - 🚫 Tabella deprecata (ha deprecation flag)
9. [ ] Filtri: nome tabella, stato (popolata/vuota/orfana),
   tipo (utente/sistema/backup), ricerca colonna trasversale

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_25_DB_Cleanup** — userà i dati che il cruscotto mostra per le
  3 fasi di cleanup (Fase A: 13 tabelle spazzatura, Fase B: 30 tabelle
  vuote agganciate al codice, Fase C: architettura `members`).
- **Chat_23_Log_Verifiche** — interseca su `audit_logs`, `access_logs`,
  `user_activity_logs`. Definire chi mostra cosa.
- **TUTTE le altre chat** — beneficiano di un cruscotto che monitora
  i numeri DB in tempo reale (es. capire i delta come quello di
  enrollments −1.350 visto tra 25/04 e 28/04).

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **SOLA LETTURA — assoluta**: nessun INSERT/UPDATE/DELETE possibile.
- **Admin-only — middleware obbligatorio**: verifica `role` su ogni endpoint.
- **Privacy mask** sui campi sensibili nel sample data (password, hash,
  token, CF in chiaro).
- **Stato DB di partenza** (al briefing 27/04 — ora aggiornato):
  - Tabelle attuali: 80+
  - Tabelle "spazzatura" identificate: 13 (vedi Z REPORT_CLEANUP_DB)
  - Tabelle vuote ma in schema: ~30
  - Tabella critica: `members` (174 colonne, ALTER bloccato per row size
    limit 8126 byte)
- **Ghost column nota in `members`**: `street_address` (DROP impossibile).
- **DB**: `stargem_v2` (MariaDB 11.4)
- **Backup base**: vedi `01_canonici/MASTER_STATUS.md` per riferimento aggiornato.
- **Architettura ibrida wrapper + binary log**: testare prima il binary log
  su IONOS per capire se è abilitato. Se non lo è, wrapper puro funziona
  comunque ma ha overhead minore.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Chat24_DB_Monitor_2026_04_27_1235 +
file F_2026_04_28_1150_ULTIMI_AGGIORNAMENTI.md (audit 28/04)*
