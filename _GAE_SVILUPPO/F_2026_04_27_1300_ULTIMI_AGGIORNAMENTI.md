Aggiornato al: 2026-04-27 13:00

# Ultimi Aggiornamenti Progetto "StarGem Manager"
**Periodo di riferimento:** 23 Febbraio 2026 - 26 Aprile 2026

Di seguito il riepilogo sintetico degli ultimi sviluppi architetturali e di bonifica:

---

### 26 Aprile 2026 (Bonifica Dati & Smart Routing Import)
* **[F1-001 → 007] Bonifica DB Storico:** Migrati 24 "orfani" QUOTATESSERA in `memberships` e 97 certificati DTYURI in `medical_certificates`. Assegnata `season_id = 1` a 929 record e normalizzati 285 SKU attività in type corretti (`workshop`, `allenamenti`, ecc). Tutto processato via transazioni atomiche SQL.
* **[F1-009 → 010] Smart Routing Import:** Blindata la route `/api/import/mapped`. Inserito routing automatico per QUOTATESSERA e DTYURI verso le rispettive tabelle, bloccando la corruzione della tabella `enrollments`. Aggiunto controllo obbligatorio sulla `season_id`.
* **[F1-010] Validazione CF:** Implementato algoritmo italiano per validazione Codice Fiscale, calcolo sesso e data di nascita, scartando i record errati con banner di blocco in fase di dry-run.

### 21 Aprile 2026 (Consolidamento Architettura Categorie)
* **[DB-001] Hard Wipe Categorie:** Eliminazione di 14 tabelle storiche frammentate (`ws_cats`, `cmp_cats`, ecc) a favore dell'unica tabella `custom_list_items`.

### 16-17 Aprile 2026 (GemTeam & Presenze)
* Importazione massiva turni/presenze da Excel.
* Creazione Dashboard Shift Full-Width e integrazione Check-In/Check-Out self-service.

### 15 Aprile 2026 (GemPortal & Area Tesserati)
* Completato sistema auth (login email/user, ruoli), GemChat (TeoBot/Claude).
* Avviata infrastruttura Upload documenti B2C (Multer persistente).

### 12-13 Aprile 2026 (GemPass & GemStaff)
* Infrastruttura GemPass: Firma digitale, tesseramento automatico con Barcode autogenerato.
* Infrastruttura GemStaff: Cedolini, Presenze Insegnanti, Disciplinare, Check Compliance contrattuale.

### 8-9 Aprile 2026 (Single Table Inheritance - STI)
* Disinnescata architettura a 11 silos in favore del modello a super-tabella `courses` e `enrollments`. DB ridotto a 72 tabelle stabili.

*(Storico pregresso archiviato per snellimento documentazione).*

### Aggiornamento 27/04/2026 13:00
- **Refactoring /elenchi (F2-025, F2-026, F2-027, F2-028)**: Riprogettata completamente l'interfaccia con sidebar laterale per le aree (Corsi, Iscrizioni, ecc) e liste in Accordion (shadcn/ui). Uniformate le etichette modali ("Stato Corso", "Interno Corso"). Le liste vengono tutte attinte e gestite centralmente tramite `custom_lists`.
- **Bugfix (F2-024)**: Risolto bug Planning su date festività UTC shift.
- **DB Migrazione (F1-015, F1-016)**: Popolamento DB `custom_lists` dalle vecchie tabelle.
- **Pulizia (PM1)**: Rimossi script di patch temporanei, output DB temporanei e backup intermedi per snellire la codebase.

### Aggiornamento 27/04/2026 13:00
- **Scheda Corso (UI & Layout):** Stabilizzato completamente il layout in stile "Dashboard". Applicato hack CSS specifico (`[&>div]:absolute [&>div]:inset-0 [&>div]:overflow-y-auto`) sul componente shadcn `Table` per confinare lo scroll all'interno della tabella e garantire il corretto funzionamento dello `sticky top-0` sull'intestazione delle colonne, mantenendo i badge e il titolo superiori completamente immobili.
- **Bugfix Calendario Attività:** Risolto un `ReferenceError` di caricamento e implementato il redirect intelligente con scroll automatico verso la card dell'evento selezionato quando si naviga dalla Scheda Corso.
