Aggiornato al: 2026-05-01 20:35

# 📝 Checklist Operativa StarGem Manager (Roadmap Fase 2)

> **Ultimo Aggiornamento:** 01 Maggio 2026, 20:35

*(Documento snellito: task storici completati prima di Aprile sono stati archiviati per pulizia).*

## Legenda Stati
- [x] = COMPLETATO
- [~] = IN CORSO / COMPLETATO MA DA VALIDARE
- [ ] = NON INIZIATO
- [!] = BLOCCATO / DIPENDENZA APERTA

---

## 1. Bonifica e Protezione Dati (Aprile 2026)
- [x] Audit e Bonifica Dati Storici DB (Orfani tessere, certificati, season_id, activity_type).
- [x] Costruzione Smart Routing in import dati.
- [x] Implementazione Validatore Codice Fiscale e Checksum.
- [ ] Integrazione Dry-Run UI per feedback errori CF e stagioni.

## 2. Refactoring Database (STI - Single Table Inheritance)
- [x] Modellazione Iniziale Database (Tabelle `activities`, `enrollments`).
- [x] DROP 16 tabelle silos vecchie (trainings, lessons, ecc).
- [x] Allineamento bridge Frontend (calendario unificato).
- [ ] Completare CRUD definitivi e clean-up del backend obsoleto se ancora esistente in specifiche route.

## 3. Moduli GemTeam & GemStaff
- [x] Cruscotto turni, Check-In live.
- [x] Gestione cedolini e compliance contrattuale insegnanti.

## 4. Modulo GemPass (Tesseramento)
- [x] Scaffold DB (`member_forms_submissions`, estensioni `memberships`).
- [x] Generazione automatica Barcode T2526XXX.
- [x] Firma documenti digitale e storage backend.

## 5. Area Tesserati (GemPortal) B2C
- [x] Route GET/POST profilo.
- [x] Upload documenti da lato client.
- [~] Sviluppo completo Frontend B2C (in corso).

## 6. Progetto CRM "Clarissa" e Intelligenza Artificiale
- [x] **Fase 1 (Osservabilità & AI Backend):** Setup Sentry, PostHog, Redis-wrapper, Vercel AI SDK, `server/ai.ts`, e rotte `/api/chat`, `/api/ai/generate-promo`.
- [x] **Fase 2 (Frontend & UX):** Refactoring `TeoCopilot.tsx` con stream, `CommandPalette.tsx` (CMD+K), `MagicPromoButton.tsx` in scheda domenica, e risoluzione TypeScript type-checking.
- [x] **Fase 3 (Sincronizzazione Dati Reali, RBAC & Telemetria AI):** Chiavi `.env` operative. Tabella `ai_usage_logs` e calcolo costi live abilitato. Test reale completato. Sicurezza AI "Hard-RBAC" completata (l'AI eredita i permessi di ruolo fisici).
- [x] **Fase 4 (Enterprise Security):** Implementato Log Management centralizzato (`Winston`) e Disaster Recovery (`backup-db.sh`). Rate-limiting attivo.
- [ ] Sincronizzazione Master Base (Gem -> Clarissa Marketing).
- [ ] Ricezione Push e Opt-out.

## Chat_08_Corsi (Fine Aprile 2026)
- [x] Bonifica magic strings `/attivita/*` (F1-015).
- [x] Endpoint `/api/workshops` fix - rimosso a favore di API unificata (F1-015).
- [x] Filtro stagione su `/api/activities-summary` (F1-015).
- [x] Creazione Endpoint cruscotto Panoramica (F1-019).
- [x] Tab Workshop/Corsi/Allenamenti/Domeniche/LI/Campus accordion completate in UI.
- [x] Toggle unificato + dropdown stagioni canonico implementato.
- [x] 5 schede dettaglio allineate al pattern `scheda-corso.tsx`.
- [ ] Refactor Schede unificato (Scenario 1 ibrido F1-020).
- [ ] Implementazione e sistemazione TAB 1 OGGI.
- [ ] Implementazione e sistemazione TAB 3 SALUTE.
- [ ] F2-019: Esecuzione badge UX.
- [ ] F2-020: Cruscotto Panoramica frontend.
- [ ] F2-?: Colonna Cellulare 8 schede.

*(Le attività relative alla UI legacy "Calendario/Planning" sono considerate stabilizzate e qui omesse).*

## Cruscotto Amministrativo (DB Monitor)
- [ ] Implementazione Cruscotto DB Monitor — **🟡 IN PAUSA** (Chat_24 audit completato, ripresa programmata nei tempi morti).
