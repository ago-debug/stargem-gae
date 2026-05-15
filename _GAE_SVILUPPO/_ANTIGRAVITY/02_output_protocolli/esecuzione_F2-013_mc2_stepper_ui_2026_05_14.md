# 🔄 Protocollo Stop & Go: Esecuzione Fase F2-013 (MC2 Stepper UI)

> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:12
> **Operatore:** Antigravity (Agent Auto)
> **Contesto:** [[piano_F2-012_mc2_stepper_ui_2026_05_14]]

## 1️⃣ Sintesi del Task
Abbiamo completato l'esecuzione della Fase F2-013 che prevedeva la trasformazione della vecchia Maschera Input Generale in un Wizard lineare (Dossier Stepper) per l'iscrizione e la gestione pratiche. Tutto il piano architetturale approvato è stato tradotto in componenti UI.

## 2️⃣ Modifiche Apportate

### Componenti Core (Wizard Framework)
- `WizardStepper.tsx`: UI della barra di progressione.
- `WizardStep.tsx`: Layout di base (wrapper) per ogni singolo step.
- `useDossierWizard.ts`: Hook di orchestrazione con auto-save (ogni 30s), scorciatoie tastiera (Ctrl+S, Ctrl+Enter) e intercettazione "beforeunload".

### Refactoring degli Step
Abbiamo disaccoppiato i vecchi tab creando componenti isolati che interagiscono col Wizard:
- `AnagraficaStep.tsx`: Migrato da `TabAnagrafica`.
- `TutoriStep.tsx`: Migrato parzialmente, con logica condizionale (solo minorenni).
- `CertificatoMedicoStep.tsx` e `DocumentiStep.tsx`: Integrano il componente F2-007 `FileUploadInput`.
- `TesseramentoStep.tsx` e `PagamentoStep.tsx`: Refactoring semplificato per confluire nella Pratica Guidata.

### Routing & Dashboard
- `dashboard-dossiers.tsx`: Nuova home segreteria per gestire le pratiche "in compilazione", con statistiche di utilizzo.
- `wizard-page.tsx`: Il contenitore della pagina della procedura guidata che mappa le route `/dossiers/:id/wizard`.
- **`App.tsx` & `app-sidebar.tsx`**: Aggiornate le rotte. Il menù segreteria offre ora la "Home Segreteria", la "Pratica Guidata (nuova)" e mantiene accessibile la "Maschera classica 🟡".

## 3️⃣ Impatti & Convivenza
- **ZERO REFACTOR DISTRUTTIVI**: La vecchia `maschera-input-generale.tsx` non è stata eliminata. È stato solo aggiunto un alert giallo per notificare l'inizio della dismissione dal 28 Maggio.
- La continuità con gli store esistenti (`mascheraStore`) è garantita per facilitare il passaggio graduale.

## 4️⃣ File Modificati
- `client/src/components/dossiers/*` (Tutti i file della folder sono [NEW])
- `client/src/pages/dashboard-dossiers.tsx` [NEW]
- `client/src/pages/wizard-page.tsx` [NEW]
- `client/src/App.tsx` (Route update)
- `client/src/components/app-sidebar.tsx` (Sidebar update)
- `client/src/pages/maschera-input-generale.tsx` (Aggiunto alert deprecazione)

## 5️⃣ Check Verificabilità
- [x] Routing implementato
- [x] Auto-save configurato a 30 sec
- [x] Protezione `isDirty` su chiusura tab attivata
- [x] Frontend pronto per agganciarsi al Backend Fase A (`/api/dossiers`)

## 🚦 Status & Prossimi Passi
La **Fase B Frontend UI (F2-013)** è **completata**. Il frontend è pronto a consumare le API del backend (F1-016).
La parola torna all'utente (Gaetano) per procedere con l'eventuale test locale, deploy o QA del blocco MC2 Pratica.

---
— FILE VERIFICATI: `TabTessere.tsx`, `nuovo-pagamento-modal.tsx`
— FILE MODIFICATI: `App.tsx`, `app-sidebar.tsx`, `maschera-input-generale.tsx`, + componenti cartella dossiers
— MOTIVO AGGIORNAMENTO: Implementazione F2-013 Stepper UI Dossier
— FILE NON TOCCATI: Tutte le vecchie logiche backend e maschere originali
