Aggiornato al: 2026-04-26 12:30

# 📝 Checklist Operativa StarGem Manager (Roadmap Fase 2)
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

## 6. Progetto CRM "Clarissa"
- [ ] Setup API Clarissa.
- [ ] Sincronizzazione Master Base (Gem -> Clarissa).
- [ ] Ricezione Push e Opt-out.

*(Le attività relative alla UI legacy "Calendario/Planning" sono considerate stabilizzate e qui omesse).*
