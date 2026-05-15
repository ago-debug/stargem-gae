# Ultimi Aggiornamenti Progetto "StarGem Manager"

> **Ultimo Aggiornamento:** 11 Maggio 2026, 18:18

**Periodo di riferimento:** 23 Febbraio 2026 - 11 Maggio 2026

Di seguito il riepilogo sintetico degli ultimi sviluppi architetturali e di bonifica:

### Aggiornamento 11/05/2026 (Ripresa Operativa)
- **Fix Calendario Attività:** Disabilitata definitivamente la logica di "Auto-advance" della stagione nel `calendar.tsx` (StopAndGo validato), garantendo che la segreteria atterri sempre sulla data odierna per le operazioni quotidiane.

### Aggiornamento 04/05/2026 (Registro di Classe e Appello Veloce)
- **Architettura API Bulk:** Creata rotta `POST /api/attendances/bulk` e metodo storage ottimizzato (`createAttendancesBulk`) per l'inserimento multi-record in un'unica query.
- **Frontend Matrice Pivot:** Rifattorizzato completamente il tab Presenze del `CourseUnifiedModal.tsx`. Introdotta vista "Registro di Classe" (Righe: allievi, Colonne: date lezioni) con eliminazione istantanea in hover.
- **UX Appello:** Introdotta Dialog massiva "Fai l'Appello" per registrare un'intera classe con 1 click.
- **Routing Rapido:** Implementato il trigger di navigazione diretta dal badge "0 presenze" della `scheda-attivita.tsx` che apre automaticamente il modale sul tab presenze corretto, popolando correttamente il subset degli iscritti attivi.

### Aggiornamento 01/05/2026 (Integrazione AI Fase 1, 2, 3 & 4 Enterprise)
- **Osservabilità Enterprise (Fase 1):** Integrazione di `Sentry` e `PostHog`. API Keys live connesse per telemetria remota.
- **Backend AI (Fase 1):** Installato `Vercel AI SDK` (gpt-4o-mini). Tool configurati `searchMembers`, `searchCourses`.
- **Frontend AI e UX (Fase 2):** Command Palette UX affinata (puntamenti corretti a `/maschera-input` e `/planning`). Magic Promo Button e Assistente Teo online. 404 Pages unificate.
- **Sicurezza AI Hard-RBAC (Fase 3):** I tool dell'assistente virtuale ereditano **fisicamente** i permessi dell'utente dal database per bloccare fughe di dati sensibili (accesso bloccato ai client).
- **Enterprise Architecture (Fase 4):** 
  - **Logging Centralizzato:** Implementato `winston` in `server/logger.ts` per rotazione log JSON giornaliera in `/logs`.
  - **Disaster Recovery:** Creato script bash `scripts/backup-db.sh` per dump notturno in `.tar.gz` (retention 30 giorni).
  - **Sicurezza Anti-Bruteforce:** Rate Limiting operativo in `server/auth.ts`.

### Aggiornamento 01/05/2026 (Potatura Chirurgica e Stabilizzazione)
- **Strumenti Diagnostici:** Installazione di Graphviz ed esecuzione Knip per estrarre la mappa esatta del codice inutilizzato e delle rotte morte.
- **Fase 1 (Pulizia Root e Frontend):** Spostati oltre 270 script di test in `_GAE_SVILUPPO/99_archivio/script_temporanei_root`. Archiviate cartelle orfane `temp_import` e `temp_project_complete`. Eliminati due file inutilizzati in `client/src/pages/`.
- **Fase 2 (Pulizia DB e Backend):** Rimozione di 7 tabelle orfane mai attivate (`crmLeads`, `crmCampaigns`, ticket manutenzione) da `shared/schema.ts`. Rimozione di 14 rotte API fantasma (es. `pagodil-tiers`, `member-discounts`, relazioni) da `server/routes.ts`.
- **Verifica Sicurezza:** Verifica formale tramite TypeScript (`npm run check`) passata con successo. Nessuna regressione registrata sulle UI in produzione. Il file di status `Z_01_05_26_1630_Architettura_Pruned.md` contiene il dettaglio completo.

### Aggiornamento 30/04/2026 (Chat_08_Corsi)
- **Sessione F1 (Backend):** Chiusi 18 protocolli backend.
- **Modifiche Query e Bonifiche:**
  - Bonifica di 2 record DT e 1011 enrollments (riassegnati a `visita_medica`).
- **Modifiche Route API:**
  - Creato endpoint `/api/dashboard/attivita-panoramica`.
  - Aggiornato `/api/activities-summary` (filtro `seasonId`).
  - Eliminato `/api/workshops` sostituito da pattern flat.
- **Sessione F2 (Frontend):** Chiusi 23 protocolli frontend.
  - Implementate 6 tab accordion canoniche per `/iscritti_per_attivita`.
  - Panoramica `/attivita` popolata con tile alti.
  - Aggiunte 6 pagine wrapper unificate.
  - Standardizzazione su 5 schede dettaglio con pattern `scheda-corso.tsx`.
  - Fix anti-crash su contenitori generici (`2526ALLENAMENTO`).

### Aggiornamento 28/04/2026 (Chat_24_DB_Monitor)
- **Audit Completato:** F1-001 (Backend) e F2-001 (Frontend) sul monitoraggio DB e UI in tempo reale.
- **Decisioni architetturali (Approvate):**
  - **Cattura modifiche AG:** Strategia IBRIDA (wrapper DB Pool + lettura binary log).
  - **Mappa Frontend↔DB:** Strategia IBRIDA (`db-map-config.ts` statico in RAM per lo schema + script di verifica notturna).

### Storico Mese di Aprile 2026 (Principali Interventi)
* **26 Aprile:** Smart Routing Import e validazione avanzata Codice Fiscale. Migrazione massiva `medical_certificates` e `memberships`.
* **21 Aprile:** Hard Wipe Categorie: Eliminazione di 14 tabelle storiche frammentate a favore di `custom_list_items`.
* **16-17 Aprile:** GemTeam & Presenze: Dashboard Shift Full-Width e Check-In/Check-Out self-service.
* **15 Aprile:** Completamento Auth, GemChat, e Area Tesserati.
* **12-13 Aprile:** Infrastruttura GemPass e GemStaff.
* **8-9 Aprile:** Architettura Single Table Inheritance (STI). Disinnescati gli 11 silos.

*(Storico pregresso archiviato per snellimento documentazione).*

### Operazioni Notturne (02/05/2026)
- **Fase 1 (Performance)**: Ottimizzazione Dashboard/Alerts. Endpoint `/api/stats/dashboard` e `/api/stats/alerts` riscritti con SQL Aggregation dirette. Prevenzione Out-Of-Memory su dataset >5000 righe.
- **Fase 1b (Build TS)**: Bonificati 18 errori TypeScript in `server/storage.ts` (join/alias) e UI (`workshops.tsx`). Il comando `npx tsc --noEmit` ora dà Zero Errori.
- **Fase 2 & 3 (Sospensione Sicurezza)**: Sospeso smantellamento di `routes.ts` (12k righe) e `maschera-input-generale.tsx` (4.5k righe) per altissimo rischio di corruzione dipendenze incrociate. I file rimangono integri, si procederà modulo per modulo con supervisione manuale.
- **Fase 4 (Sicurezza Pagamenti)**: Audit completato. Implementato blocco backend/frontend contro importi negativi. Implementata coerenza obbligatoria `Metodo/Data` quando lo stato è `Paid`.
