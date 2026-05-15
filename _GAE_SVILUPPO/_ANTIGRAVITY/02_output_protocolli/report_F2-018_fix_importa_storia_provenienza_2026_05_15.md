# F2-018 — Fix UI /importa Lotto 1 + Storia & Provenienza

> **Autore:** Antigravity (F2)
> **Data:** 15 Maggio 2026, 11:58
> **Stato:** Completato

---

## 1. Estensione MEMBER_FIELDS
Abbiamo aggiunto tutti i campi necessari per supportare il caricamento del "Lotto 1" (migrazione da Athena e Fogli Google storici). Nello specifico, ora `MEMBER_FIELDS` in `import-data.tsx` espone alla mappatura UI i seguenti campi:
- **Dati Bancari:** `iban`, `bankName`, `ridNumber`
- **Domicilio Specifico:** `domicileAddress`, `domicileZip`, `domicileCity`, `domicileProvince`, `domicileCountry`
- **Campi Documento:** `documentIssuedBy`, `documentIssueDate`
- **Campi Legacy di Classificazione:** `categoryLegacy`, `groupLegacy`
- **Tutore Neutrale 1:** `tutor1FirstName`, `tutor1LastName`, `tutor1FiscalCode`
- **Note Sanitarie:** `healthNotes`

Tutti i campi "spazzatura" o puramente architetturali legacy (`chi_scrive`, `masterID`, `athenaTessera`) **non** sono esposti volontariamente all'utente per evitare affaticamento visivo: saranno catturati al volo dal Backend (attraverso logiche previste in F1-021b) e inseriti dentro il JSON `extra_data`.

---

## 2. Chunking e Upload Progressivo
Il più grande rischio per un file di 4.000 righe era il timeout di rete.
La funzione `handleMappedImport` è stata rimpiazzata da `handleChunkedImport`.
- **Libreria impiegata:** `papaparse` (parse rapido lato client), `uuid` per generare il `batch_id`.
- **Esecuzione:** Il CSV viene "affettato" in blocchi da **500 righe** per invio.
- **Progress Bar:** È stata integrata un'interfaccia a rimpiazzo del bottone "Conferma" che mostra la % di caricamento e lo stato corrente (`Importazione chunk X di Y...`).
- **Annullamento:** Se si preme "Annulla Chunk Successivi", il caricamento non procede, preservando i blocchi precedenti.
- **Sicurezza UX:** Un `onbeforeunload` avvisa l'utente impedendogli di chiudere il browser sbadatamente.

---

## 3. Gestione Scarti e Log di Conflitto
Alla fine della procedura, l'interfaccia visuale dei risultati ("X Inseriti, Y Aggiornati...") ora prevede due nuovi bottoni:
- **📥 Scarica scarti CSV:** Richiama la rotta `/api/import/batch/:batch_id/skipped`. Utile per consegnare a Gaetano i record che non hanno superato i vincoli del DB.
- **📥 Scarica log conflitti CSV:** Richiama la rotta `/api/import/batch/:batch_id/conflicts`.

*(Se non è previsto un `batch_id` restituito dal server in caso di errori legacy, la UI ripiega alla generazione dinamica del CSV scaricandolo dal client, in modo completamente compatibile).*

---

## 4. Nuova Tab: Storia & Provenienza
È stato creato il componente `client/src/components/dossiers/StoriaProvenienzaTab.tsx`.
Il componente è isolato, accetta come `prop` il `memberId` ed effettua chiamate autonome per recuperare sia l'anagrafica che gli `auditLogs`.

Layout a griglia con 4 sezioni fondamentali:
1. **Sorgente Dati:** Mostra se l'utente è "nativo" (Inserimento Diretto) oppure importato (mostrando il file originario, chi lo ha caricato, e la riga esatta).
2. **Dati Storici Legacy (Athena / Master):** Una sezione intelligente. Se in `extra_data` ci sono campi come `athena_scadenza_cert` o `master_chi_scrive`, essi appaiono incolonnati assieme al `legacyAthenaId`. Se non c'è nulla di legacy, la card sparisce.
3. **Data Quality Flags:** Se il membro ha segnalazioni importanti (es. CF placeholder, errore formattazione, minorenne con CF estero), compaiono le **Badge visive** rosse e arancioni per far intervenire il CRM manager.
4. **Audit Trail (Cronologia):** Un menu ad organetto mostra la cronologia esatta delle variazioni recuperata tramite `/api/members/:id/audit-log`, con un diff chiaro del valore vecchio (`vecchio → nuovo`).

---

## ✅ Verifiche di Sistema Superate
- **Typescript Compilation:** `npx tsc --noEmit` completato con codice **0** (nessun errore TypeScript introdotto, e risolti i conflitti).
- **Build Client:** `npm run build` eseguito con successo, chunk compilati correttamente.
- Nessun intervento di business logic effettuato nel backend (lasciato al task F1-021b).
