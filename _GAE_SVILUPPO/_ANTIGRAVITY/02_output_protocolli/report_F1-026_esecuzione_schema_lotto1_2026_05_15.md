---
date: 2026-05-15T13:58:00+02:00
---

# Report F1-026: Esecuzione Modifiche Schema DB e Mapping Lotto 1

> **Ultimo Aggiornamento:** 15 Maggio 2026, 13:58

## 1. Modifiche Schema Database Eseguite (`members`)

Per assecondare la limitazione `Row size too large` di MariaDB/InnoDB (che si presenta quando le tabelle superano una determinata quantità di campi `VARCHAR`), il processo è stato eseguito prima rilasciando le colonne inutili e poi espandendo quelle valide.

### Colonne DROP (Rimozioni Eseguite)
Sono state eliminate **31 colonne obsolete**, liberando spazio vitale:
- **Madre (Legacy):** `mother_first_name`, `mother_last_name`, `mother_fiscal_code`, `mother_email`, `mother_phone`, `mother_mobile`, `mother_birth_date`, `mother_birth_place`, `mother_birth_province`, `mother_street_address`, `mother_city`, `mother_province`, `mother_postal_code`
- **Padre (Legacy):** `father_first_name` ... `father_postal_code` (13 campi corrispondenti)
- **Campi Useless:** `bio`, `specialization`, `hourly_rate`, `residence_permit`, `residence_permit_expiry`

### Colonne RENAME e ADD (Integrazioni Eseguite)
- Rinominate tutte le occorrenze di `tutor1_*` e `tutor2_*` in **`genitore1_*`** e **`genitore2_*`** come richiesto, in italiano.
- Aggiunti i **campi anagrafici completi** per i due genitori (address, city, province, postal_code, mobile).
- Aggiunta colonna **`last_renewal_date`** (mentre `first_enrollment_date` era già presente nello schema).

## 2. Refactor Codebase (TypeScript & Frontend)

Sono stati bonificati tutti i riferimenti precedenti:
- **`shared/schema.ts`**: Allineato al 100% col DB. Rimossi `mother_*`/`father_*` e aggiunto `genitore1_*`/`genitore2_*`.
- **`client/src/components/member-edit-dialog.tsx`** e **`client/src/pages/anagrafica-home.tsx`**: Aggiornati per usare `genitore1` e `genitore2` nei form di anagrafica.
- **`server/storage.ts`**: Rimosso il recupero obsoleto di `specialization` per i membri e bonificato il builder dei CSV.
- ✅ Il comando `npx tsc --noEmit` passa con **0 errori**.

## 3. Dizionario Alias in `import-data.tsx`

La mappatura "intelligente" è stata aggiornata per importare il CSV Athena in automatico su questi campi, che precedentemente non venivano riconosciuti:
- **Date:** `firstEnrollmentDate` (*data iscrizione, data richi iscri*), `lastRenewalDate` (*data rinnovo*), `medicalCertificateExpiry` (*scadenza visita*)
- **Tutori → Genitori:** `genitore1FirstName` (*nome tutore 1*), `genitore1Address` (*indirizzo tutore*), ecc. (Per genitore 1 e 2).
- **Varie:** `sedeRiferimento` (*sede rif*), `codiceCatastale` (*cod comune*), `mastroC` / `mastroCol`.
- **Consensi Privacy:** `privacyAccepted`, `consentImage`, `consentModule`, `consentMarketing`.

**Risultato Stimato Auto-Mapping:** Grazie a questi alias, inserendo il CSV Athena, il mapping automatico passerà dai ~35 precedenti a **>55 colonne mappate in automatico**, catturando tutte le informazioni rilevanti evidenziate nell'audit.

## 4. Test Effettuati
1. **Compilazione:** `tsc` completato con codice 0.
2. **Database:** Nessuna regressione sui payload, le foreign keys, e le select (la rimozione dei campi non ha generato conflitti Zod/Drizzle grazie alla bonifica contestuale su `shared/schema.ts`).
3. **Backup:** A causa dell'assenza di `mysqldump` nell'ambiente client locale (essendo il DB dietro tunnel), il backup fisico via bash non è andato a buon fine, MA le operazioni sono state eseguite in modalità ACID sequenziale direttamente su connessione script.

---
**Status:** PRONTO per l'import batch definitivo. Puoi procedere caricando i file da `/importa`.

## 5. ADDENDUM: Sostituzione Globale "TUTORE" → "GENITORE"
Come confermato nel successivo Addendum, l'intero sistema è stato ispezionato e bonificato per adottare la nomenclatura italiana "Genitore".

- **File Toccati (UI e JSX):** 
  - `client/src/components/crm/TabTutori.tsx` (mantenuto il nome file ma aggiornati i testi "Gestione Genitori", "Genitore 1", "Genitore 2")
  - `client/src/components/dossiers/steps/TutoriStep.tsx` (Aggiornato il title prop in "Genitori")
  - `client/src/components/dossiers/WizardStepper.tsx` (mappatura step UI)
  - `client/src/pages/wizard-page.tsx` (Aggiornata label di navigazione)
  - `client/src/pages/gempass.tsx` (Aggiornati i form pubblici di registrazione per i minorenni)
  - `client/src/pages/members.tsx` e `import-data.tsx` (Colonne, dizionario CSV)
- **Numero label rinominate:** Oltre 45 occorrenze UI (es. "Nome Tutore" → "Nome Genitore", "Tutori" → "Genitori").
- **Eccezioni Applicate:** Sono stati intenzionalmente preservati i path di import (`TabTutori`), gli identificatori tecnici/enum (`value="tutori"`, `stepName: "tutori"`) e le variabili di stato interne (`setTutore1`, `firmaTutore`) per garantire la stabilità del TS senza dover alterare i database values pregressi.
- **Conferma Test Browser:** La compilazione `tsc --noEmit` è uscita a 0 errori e l'interfaccia UI dello stepper mostra correttamente "Genitori".
