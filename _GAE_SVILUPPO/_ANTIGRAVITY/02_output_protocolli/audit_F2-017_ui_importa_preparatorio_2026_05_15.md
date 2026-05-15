---
aggiornato: 2026-05-15T11:05
fonti:
  - "[[piano_F1-021a_athena_master_diff]]"
---

# 🕵️‍♂️ Audit Preparatorio: UI Importa (Lotto 1)

> **Operatore:** Antigravity (Agent Auto)
> **Contesto:** Task F2-017 — Preparazione terreno Frontend per allineamento importazione dati storici Athena/Master.
> **Metodo:** Read-Only Analysis (ZERO Patch).

## 1️⃣ Snapshot UI Attuale (`/import-data.tsx`)

L'attuale Wizard di Importazione si articola su **3 Step Sequenziali**:
1. **Caricamento Sorgente:** Upload CSV/Excel, Google Sheets o incolla Raw Text. Scelta Entità (`members`, `payments`, `enrollments`, ecc.).
2. **Mappatura Colonne:** Interfaccia drag & drop implicita con Select. Divide le colonne in "Da Mappare" e "Già Mappate". Mostra una preview tabellare live (5 righe) + bottone geniale "Copia testo per Antigravity" per campi non trovati.
3. **Esegui e Riporta (Dry-Run & Commit):** Invoca `POST /api/import/mapped` in dry-run. Mostra una Dashboard di Impatto (Da Inserire, Aggiornare, Invariati, Errori). Segnala criticamente `missingCfRecords` e `missingSeasonRecords` (con fix one-click "Assegna stagione 25/26").

### Validazioni Client-side:
- **Hard Block Anagrafica:** Rifiuta la mappatura se non è stato assegnato almeno "Nome" o "Cognome".
- **Visual Alert:** Righe senza `Codice Fiscale` valido vengono isolate in un alert rosso escludendole preventivamente.

---

## 2️⃣ Tabella Confronto Campi (Athena/Master vs UI)

Dall'analisi degli header estratti dai CSV storici (Athena ~90 colonne, Master ~20 colonne), ecco la discrepanza rispetto ai `MEMBER_FIELDS` attuali.

| Campo CSV Originale | Presente in UI (`MEMBER_FIELDS`) | Note / Destinazione Ideale |
| :--- | :---: | :--- |
| **Dati Bancari** (`IBAN`, `Banca`, `Numero RID`) | 🔴 NO | Vanno esposti in UI sotto una nuova sezione "Dati Bancari". |
| **Domicilio** (`Indir. Domicilio`, `CAP Domic.`, `Citta Domicilio`, `Prov. Domic.`) | 🔴 NO | Esporre in UI come "Domicilio Diverso da Residenza". |
| **Documenti Rilascio** (`Documento rilasciato da`, `Data Ril. Doc.`) | 🔴 NO | Mancano in UI (abbiamo solo Tipo e Scadenza). |
| **Consensi Vari** (`Consenso Invio`, `Con. Invio mail 2`) | 🟡 Parziale | Possibile mapping su `newsletterConsent` / `marketingConsent`. |
| **Note Biomediche** (`Note Sanitarie / Alimentari`) | 🔴 NO | Esporre in UI sotto "Dati Medici/Privacy". |
| **Legacy Athena** (`athenaTessera`, `Cod. Catast. Comune`) | 🔴 NO | **Nascondere da UI.** Mappare in JSON `legacy_data` backend. |
| **Campi Master** (`chi_scrive`, `venduto_da`, `consegna_wk_e_bm`) | 🔴 NO | **Nascondere da UI.** Mappare in JSON `legacy_data` backend. |
| **Gruppi** (`Sigla Famiglia`, `Categoria`, `Società di Provenienza`) | 🔴 NO | Esporre come nuovi campi "Classificazione". |

---

## 3️⃣ Proposta Estensione UI (Post F1-021b)

Quando il Backend sarà pronto (fine `F1-021b`), aggiorneremo l'interfaccia UI in questo modo:

1. **Standard (Da Mappare in UI):**
   - Aggiungere alla costante `MEMBER_FIELDS` i campi Mancanti: `domicileAddress`, `domicileCity`, `domicileZip`, `domicileProvince`, `iban`, `bankName`, `healthNotes`.
2. **Campi Tecnici Nascosti (Automapping Backend):**
   - L'UI **non** esporrà i campi "spazzatura/legacy" (es. `masterID`, `chi_scrive`). L'utente non deve mapparli manualmente. Verranno spediti in blocco in un campo generico `extra_raw_data` o gestiti dal backend.
3. **Data Quality Badge:**
   - Ampliare il Dry-Run (Step 3) affinché il tab "Errori" segnali i `duplicatedFiscalCode` (CF già presenti ma con anagrafiche incongruenti nel CSV) prima di fare overwrite.

---

## 4️⃣ UX Miglioramenti Consigliati (Lotto 1 Massivo)

Importare **3.800+ record** in una singola botta su Node.js/React presenta grossi rischi UX.

- **Rischio Timeout (NGINX/Browser):** Attualmente la mutazione aspetta l'intero completamento dal backend. Una richiesta di 4.000 righe + check incrociati durerà oltre 30-45 secondi. C'è rischio di "Connection Timeout".
- **Soluzione Proposta (Chunking UI):** Modificare `handleMappedImport` per dividere il CSV in *chunks* da 500 righe, inviandoli in serie. Mostrare una vera **Progress Bar %** iterativa.
- **Sicurezza:** Aggiungere il blocco `window.onbeforeunload` per impedire la chiusura accidentale del browser durante l'import.
- **Reportistica Finale:** Tasto "Scarica Log Errori (CSV)" alla fine dell'import, per far scaricare a Gaetano la lista delle sole righe fallite (con motivazione) da sistemare su Excel e re-importare.

---

## 5️⃣ Domande Operative per Gaetano

Rispondi a queste domande per sbloccare la costruzione della UI finale (F2-018):

1. **Gestione Campi Minori:** Mappiamo i campi storici minori (es. `venduto_da`, `consegna_wk_e_bm`, `Cod. Catast. Comune`) in un campo "nascosto" `legacy_metadata` nel DB senza appesantire l'interfaccia, oppure vuoi delle vere e proprie colonne visibili e mappabili nel Wizard?
2. **Prevenzione Timeout:** Per 4.000+ righe, il browser potrebbe bloccarsi. Preferisci che implementi un invio a pacchetti (es. 500 alla volta con barra di caricamento %) oppure lasciamo l'invio singolo e speriamo che il server sia veloce?
3. **Gestione Errori:** Vuoi poter scaricare un file Excel/CSV con gli "scarti" alla fine dell'import (righe ignorate e motivo dell'errore) per poterle pulire e re-inserire?

> ⏳ **Stima Lavoro F2-018 (Esecuzione UI):** ~2h 30m (Aggiunta campi, Chunking Progress Bar, Export Log).
