# 🛡️ Protocollo di Verifica Operativa: F2-014 (Frontend MC1+MC2+MC3)

> **Data Esecuzione:** 14 Maggio 2026, 20:18
> **Operatore:** Antigravity (Agent Auto)
> **Contesto:** F2-014 Verifica Post Fase 3
> **Modalità:** Read-Only & Headless Check

## 📊 Tabella Esiti (Pass/Fail)

| ID | Test Suite | Esito | Note / Dettaglio |
| :--- | :--- | :---: | :--- |
| **T1** | Build TypeScript Pulito | 🔴 **FAIL** | 11 errori in 4 file del nuovo Wizard (tipizzazione `FileUploadInput` e `dossier_state`). |
| **T2** | Accessibilità Route | 🟢 **PASS** | `curl` su `localhost:5001/dashboard/dossiers` restituisce `200 OK`. Routing SPA funzionante. |
| **T3** | Configurazione Sidebar Menu | 🟢 **PASS** | Voci "Home Segreteria", "Pratica guidata (nuova)", e "Maschera classica 🟡" presenti. |
| **T4** | Esistenza Componenti Wizard | 🟢 **PASS** | Tutti i 10 moduli `WizardStepper`, `useDossierWizard` e gli `Step` sono correttamente posizionati. |
| **T5** | Eliminazione Base64 (FileUpload) | 🟡 **WARN** | `FileReader` e `canvas` eliminati dal core Pratica, ma persistono in 6 file isolati (es: `TabStampaTessere`, `gemteam`). |
| **T6** | Componenti Quick Win (F2-011) | 🟡 **WARN** | Moduli presenti, eccetto `HelpTooltip.tsx` che risulta assente (`No such file or directory`). |
| **T7** | Banner Dismissione Maschera | 🟢 **PASS** | Alert "Stai usando la maschera classica..." con data (28 Maggio) integrato in `maschera-input-generale.tsx`. |
| **T8** | Rinomina "Anagrafica Generale" | 🟢 **PASS** | Voce `title: "Utente"` inserita in `app-sidebar.tsx`. Alcune ricorrenze legacy rimaste in documentazione/log. |

---

## 🐛 Bug Emersi e Regressioni (Action Items)

Di seguito le non-conformità rilevate, ordinate per priorità di intervento (nessuna patch è stata applicata in questo ciclo).

### 🔴 ALTA PRIORITÀ (Da fixare prima del merge/deploy F2-013)
1. **Tipizzazioni in `CertificatoMedicoStep` e `DocumentiStep`**
   - **Errore:** Il componente `FileUploadInput` sta sollevando errori perché gli viene passata una prop `memberId` non definita nella sua interfaccia `IntrinsicAttributes & FileUploadInputProps`.
   - **Errore:** Parametri `fileUrl` tipizzati implicitamente come `any` nelle callback di upload.
   - **Impatto:** Blocca la build CI/CD.

2. **Tipizzazioni in `wizard-page.tsx` e `dashboard-dossiers.tsx`**
   - **Errore:** Mismatch di tipo su `initialDossier` (proprietà `data` mancante).
   - **Errore:** TS considera la variabile `dossiers` in dashboard come `unknown` perché derivata dal `useQuery` senza generics di tipizzazione (`any[]`).
   - **Impatto:** Blocca la build CI/CD.

### 🟡 MEDIA PRIORITÀ (Tecnica)
3. **Residui FileReader/Canvas (Storage Locale)**
   - Trovati in `members.tsx`, `member-edit-dialog.tsx`, `anagrafica-home.tsx` (avatar/upload vecchi), `gemteam.tsx` (cam), `membership-card.tsx`.
   - **Azione richiesta:** Estendere il refactoring di `FileUploadInput` anche a questi moduli isolati per sradicare del tutto il Base64 dal progetto (Chat_25 follow-up).

4. **Assenza componente `HelpTooltip.tsx`**
   - Segnalata l'assenza del file `client/src/components/shared/HelpTooltip.tsx` tra le Utilities F2-011. Era previsto dal piano ma non è stato tracciato.

### 🟢 BASSA PRIORITÀ (Cosmetica)
5. **Dicitura "Anagrafica Generale"**
   - Presente come etichetta in `utenti-permessi.tsx`, `gestione-note.tsx` e nella `knowledge-base.tsx`. Non impatta il cliente ma andrebbe standardizzata in "Utente" come fatto nella sidebar.

---
**Status Protocollo:** ESEGUITO. Il sistema necessita di un giro di `fix-ui-wf` per correggere i type errors prima di poter essere compilato in produzione. Attendo istruzioni.
