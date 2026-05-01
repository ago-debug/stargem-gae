# Ultimi Aggiornamenti Progetto "StarGem Manager"

> **Ultimo Aggiornamento:** 01 Maggio 2026, 19:20

**Periodo di riferimento:** 23 Febbraio 2026 - 01 Maggio 2026

Di seguito il riepilogo sintetico degli ultimi sviluppi architetturali e di bonifica:

### Aggiornamento 01/05/2026 (Integrazione AI Fase 1, 2 & 3)
- **Osservabilità Enterprise (Fase 1):** Integrazione di `Sentry` nel Node.js (`server/index.ts`) e React (`main.tsx`) per l'error tracking. Integrazione di `PostHog` per product analytics. Wrapper `Redis` (`server/cache.ts`) con logica di tolleranza ai fallimenti (fallback silenzioso). Inizializzazione testing E2E con `Playwright`.
- **Backend AI (Fase 1):** Installato e configurato `Vercel AI SDK` (downgradato alla v3.4.33 per stabilità con Express). Creazione del modulo `server/ai.ts` (modello `gpt-4o-mini`, strumenti DB `searchMembers` e `searchCourses`). Configurazione degli endpoint API `/api/chat` e `/api/ai/generate-promo`.
- **Frontend AI e UX (Fase 2):** Refactoring di `TeoCopilot.tsx` verso stream AI-SDK `useChat()`. Implementazione globale della **Command Palette** (`CMD+K`) basata su `cmdk`. Integrazione del **Magic Promo Button** all'interno della `scheda-domenica.tsx` (connesso all'API `/api/ai/generate-promo` e con copia rapida). Piena risoluzione dei type-checking TypeScript errors.
- **Telemetria, Costi e Admin Hub (Fase 3):** Creazione tabella `ai_usage_logs` e calcolo finanziario preciso ($/token) agganciato al backend Vercel AI (`onFinish`). Nel pannello Amministratore `/admin` è stata inserita la **Dashboard Consumi AI** (polling 30s) e il nuovo **Hub Telemetria Sentry/PostHog** dotato di bottoni di "Hard Crash" e "Test Event" connessi live alle piattaforme esterne (con URL di progetto diretti). Test reale dell'Agente Teo superato con successo su ricerca DB.

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
