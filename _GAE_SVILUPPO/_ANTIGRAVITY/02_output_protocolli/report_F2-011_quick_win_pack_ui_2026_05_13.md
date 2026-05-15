# F2-011 — Quick Win Pack UI

> **Ultimo Aggiornamento:** 13 Maggio 2026, 19:45

## Stato di Completamento Task

### Task A — SEG-004 Telefoni malformati
- [x] Creato `phoneValidator.ts` con logica regex avanzata per pulizia prefissi e check formati validi italiani.
- [x] Creato componente `PhoneBadge.tsx` con tooltip esplicativo in caso di formato invalido o warning.
- [x] Applicato il pattern su `members.tsx` per la tabella principale anagrafica inserendo una colonna esplicita per Data Quality / Errori telefono.
**Stato**: 100% Completato

### Task B — Migrazione SortableHeader a 4 call site restanti
- [x] Sostituito in `payments.tsx` il pattern obsoleto con `<SortableHeader>` e `useSortableList`.
- [x] Sostituito in `iscritti_per_attivita.tsx` aggiornando l'implementazione per supportare liste multiple in accordion esportando il nuovo metodo `sortArray`.
- [x] Sostituito in `gempass.tsx` (modificate due tabelle, iniettata logica di sorting locale per tessere utente).
- [x] Sostituito in `scheda-attivita.tsx` per l'elenco iscritti all'attività.
**Stato**: 100% Completato (TypeScript Build Validata a Zero Errori App).

### Task C — SEG-002 Rinomina "Anagrafica" in "Utente" (solo UI)
- [x] Creata procedura batch iterativa per analizzare e sostituire le occorrenze esatte ("Anagrafica Generale", "Aggiunta Rapida Anagrafica", "Modifica Anagrafica", ecc.) con le corrette controparti "Utente".
- [x] Applicato il renaming a livello visuale su Sidebar, Breadcrumbs, Headers, e Modals su 12+ componenti senza alterare le associazioni DB, routes o IDs.
**Stato**: 100% Completato.

### Task D — 3 Tooltip "Help" nei punti critici operativi
- [x] `TabTutori.tsx`: Inserito tooltip che indica l'obbligatorietà del tutore legale per tesserati minorenni.
- [x] `TabTessere.tsx`: Inserito tooltip per il caricamento del certificato PDF (best practice).
- [x] `nuovo-pagamento-modal.tsx`: Inserito tooltip a fianco al titolo per indicare le funzionalità di generazione ricevuta e selezione del metodo di pagamento.
**Stato**: 100% Completato.

---

— FILE VERIFICATI
`members.tsx`, `payments.tsx`, `useSortableList.ts`, `gempass.tsx`, `iscritti_per_attivita.tsx`, `scheda-attivita.tsx`, `TabTutori.tsx`, `TabTessere.tsx`, `nuovo-pagamento-modal.tsx`

— FILE MODIFICATI
- `client/src/hooks/useSortableList.ts`
- `client/src/pages/gempass.tsx`
- `client/src/pages/iscritti_per_attivita.tsx`
- `client/src/pages/scheda-attivita.tsx`
- `client/src/components/app-sidebar.tsx`
- `client/src/pages/members.tsx`
- `client/src/components/QuickMemberAddModal.tsx`
- `client/src/components/member-edit-dialog.tsx`
- `client/src/components/crm/TabAnagrafica.tsx`
- `client/src/pages/maschera-input-generale.tsx`
- `client/src/pages/payments.tsx`
- `client/src/pages/anagrafica-home.tsx`
- `client/src/pages/studio-bookings.tsx`
- `client/src/pages/calendar.tsx`
- `client/src/pages/access-control.tsx`
- `client/src/pages/gemstaff.tsx`
- `client/src/components/gempass/TabCertificati.tsx`
- `client/src/components/gempass/TabTessereEnte.tsx`
- `client/src/components/crm/TabTutori.tsx`
- `client/src/components/crm/TabTessere.tsx`
- `client/src/components/nuovo-pagamento-modal.tsx`

— MOTIVO AGGIORNAMENTO
Esecuzione auto-iterativa del Quick Win Pack UI. Migrazione dei pattern obsoleti, miglioramento della terminologia UX (SEG-002), fixing dei data quality UI (SEG-004), estensione ordinamento colonna (SEG-003) e adozione di componentistica UI descrittiva tramite tooltips. Compilazione validata via TSC.

— FILE NON TOCCATI
Nessuna componente backend modificata. Il database schema, API server e rotte rimangono inalterati secondo i vincoli.
