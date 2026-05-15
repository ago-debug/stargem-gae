---
aggiornato: 2026-05-14T20:00:00+02:00
fonti:
  - "[[piano_F1-015_mc2_pratica_stepper_be_2026_05_13]]"
---

# Piano Architetturale: MC2 Stepper UI Frontend

## TL;DR
Il flusso attuale di inserimento anagrafica e iscrizione avviene su una singola pagina (`maschera-input-generale.tsx`) frammentata in numerose "Tabs" e modali, che permette inserimenti incompleti e fallimenti silenziosi. Questo piano descrive l'implementazione del **Macro-Cantiere 2 (MC2) Frontend**: un componente `WizardStepper` lineare che si appoggia all'infrastruttura backend `dossiers`. Il nuovo stepper bloccherà l'avanzamento se mancano requisiti fondamentali (hard-block), salverà i progressi in bozza automaticamente e fornirà alla segreteria una nuova Dashboard per riprendere le pratiche in sospeso.

## Mappa Step per Dossier Type

| Tipo Pratica | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 | Step 6 |
|---|---|---|---|---|---|---|
| **iscrizione_corso** | Anagrafica | - | Cert. Medico | Pagamento | Tesseramento | Iscrizione Attivita |
| **nuovo_iscritto** | Anagrafica | Tutori (se min.) | Cert. Medico | Documenti | Pagamento | Tesseramento |
| **rinnovo** | Pagamento | Tesseramento | - | - | - | - |
| **acquisto_carnet** | Pagamento | - | - | - | - | - |

## 3 Domande Operative per Gaetano
1. **Backward Compatibility**: Sostituiamo COMPLETAMENTE `maschera-input-generale.tsx` con Wizard o lasciamo entrambi per una fase di transizione (backward compat) di 2 settimane?
2. **Auto-Save Bozza**: L'auto-save bozza ogni 30 secondi è accettabile o preferisci mantenere esclusivamente un pulsante di "salvataggio manuale" per evitare eccessive scritture a DB se la segreteria si allontana?
3. **Scorciatoie Tastiera**: Le scorciatoie (Ctrl+S per salvare bozza, Ctrl+Enter per completare step) sono utili per una segreteria veloce o rischiano di creare click accidentali da evitare?

---

## 1. Censimento Pagine/Componenti Attuali (da sostituire o rifattorizzare)
- `client/src/pages/maschera-input-generale.tsx`: Attualmente fa da contenitore enorme con logica `useMascheraStore`. Verrà progressivamente deprecata o mantenuta temporaneamente.
- `client/src/components/crm/TabAnagrafica.tsx`: Contiene dati utente e accordions. Verrà rifattorizzato in uno step isolato.
- `client/src/components/crm/TabTutori.tsx`: Contiene dati genitori. Verrà estratto per essere invocato solo se l'utente è minorenne.
- `client/src/components/crm/TabTessere.tsx`: Gestisce la quota associativa.
- `client/src/components/crm/TabAllegati.tsx`: Logica di upload e moduli (privacy, regolamento).
- `client/src/components/nuovo-pagamento-modal.tsx`: Attuale "checkout unificato". Logica da smontare e fondere in uno/due step nativi (preventivatore + saldo).

## 2. Architettura Wizard/Stepper Target (Shadcn/UI-based)
Il cuore sarà il nuovo componente `<WizardStepper>`:
- **Progress Visivo**: Barra di step in alto numerata (es: 1 → 2 → 3 → 4).
- **Flusso Obbligato**: A differenza delle tab libere attuali, per passare allo step N+1 bisogna superare la validazione dello step N.
- **Hard-Block Reali**: La logica richiederà un `GET /api/dossiers/:id/required-steps` dal backend. Se fallisce una business rule (es. tessera non pagata), il pulsante "Avanti" è inibito.
- **Bottoni Footer**: "Indietro", "Avanti", "Salva Bozza".
- **Stato Incompleto**: Indicatore visivo di stato "dirty" con eventuale auto-save bozza ogni 30s.

## 3. Hook `useDossierWizard`
Sostituirà parte delle responsabilità di Zustand centralizzando lo stato del dossier:
- **Stato**: `currentStep`, `dossierData`, `isValidating`, `blockingErrors`.
- **API (React Query)**:
  - `createDossier`: Inizializza la bozza.
  - `updateStep`: PATCH dati parziali (auto-save).
  - `completeStep`: Avanzamento di stato controllato.
  - `finalCompleteDossier`: Submit finale all'orchestratore.
  - `saveAsDraft`: Salvataggio esplicito o auto-save.

## 4. Dashboard Pratiche Aperte (Nuova Home)
- Componente `<DashboardSegreteria>` in route `/dashboard/dossiers`.
- **Sezione "Le tue pratiche in corso"**: Lista filtrata per `createdBy=currentUser` e `status=bozza/in_compilazione`.
- **Sezione "Pratiche assegnate"**: Opzionale, per deleghe ad altri operatori.
- **Azione "Riprendi"**: Cliccando sulla riga, si riapre il Wizard riportando l'operatore esattamente al `currentStep` salvato.

## 5. Strategia di Migrazione Graduale
- Si manterranno le pagine attuali (Tab) per circa 2 settimane come meccanismo di fallback.
- La rotta `/dashboard/dossiers` sarà l'entry point per le nuove pratiche MC2.
- Una volta testato in produzione e validato dal team, `maschera-input-generale.tsx` verrà rimossa e deprecata definitivamente.

## 6. UX Miglioramenti
- **Auto-Save**: Autosave parziale ogni 30 sec (chiamata PATCH non distruttiva).
- **Feedback Visivo**: Badge "Salvato 2 min fa" o "Modifiche non salvate".
- **Warning di Uscita**: Se si chiude il browser/tab con stato dirty, si lancia un avviso standard del browser.
- **Tooltip Bloccanti**: Se uno step è bloccato (es. manca certificato), il bottone Avanti sarà disabilitato con un tooltip che ne spiega il motivo (es. "Manca certificato medico valido").

## 7. Stima Tempi Esecuzione FE (per futuro F2-013)
| Task | Componente | Stima (h) |
|---|---|---|
| Step 1 | `<WizardStepper>` base componente | 2-3h |
| Step 2 | Hook `useDossierWizard` e integrazione BE | 3-4h |
| Step 3 | Refactor `TabAnagrafica` come Step 1 | 2-3h |
| Step 4 | Refactor `TabTutori`, `TabTessere`, `TabAllegati` | 3-4h |
| Step 5 | Integrazione checkout (`NuovoPagamentoModal`) | 2-3h |
| Step 6 | Dashboard pratiche aperte e routing | 3-4h |
| Step 7 | Auto-save, dirty state, scorciatoie | 2-3h |
| **Totale** | **MC2 Stepper UI (Frontend)** | **17-24h (3-4 sessioni)** |
