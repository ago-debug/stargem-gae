---
aggiornato: 2026-05-15T15:40
ultima_verifica_vs_codice: 2026-05-15T15:40
validita_prevista: 2026-05-30
fonti_verificate:
  - "[[db_audit_15_05_2026]]"
  - "[[client/src/pages/import-data.tsx]]"
---

# Audit F1-029 V2: Cleanup, Extension Schema e Mapping CSV Athena
> **Ultimo Aggiornamento:** 15 Maggio 2026, 15:40

## 1. Tabella 5 categorie CSV (Inclusi Chiarimenti A+B)

### 🟢 Utile_aggiungi_members_DB (Anagrafica + Ciclo Vita Cliente)
*Campi da preservare come colonne dedicate in Drizzle/DB, inclusi i campi vuoti nel DB attuale ma critici per il ciclo vita.*
- **Ciclo vita:** `cancellation_notes` (TESTO), `is_socio` (BOOLEAN). Note: `cancellation_date`, `active` e `first_enrollment_date` esistono già.
- **Finanziari:** `codice_mandato_rid` (VARCHAR), `data_mandato_rid` (DATE), `mod_pagamento` (VARCHAR), `fattura_v_azienda` (BOOLEAN). Note: `codice_fe` (Cod. Id. FE) e `email_pec` esistono già.
- **Famiglia/Sconti:** La sigla famiglia mappa sull'esistente `family_code`.
- **Documenti Identità Tutori & Stranieri:**
  - `permesso_soggiorno` (VARCHAR), `permesso_soggiorno_scadenza` (DATE), `permesso_soggiorno_rilasciato_da` (VARCHAR), `permesso_soggiorno_data_rilascio` (DATE)
  - `documento_tutore1` (VARCHAR), `scadenza_doc_tutore1` (DATE), `stampa_in_ric_tutore1` (BOOLEAN)
  - `documento_tutore2` (VARCHAR), `scadenza_doc_tutore2` (DATE), `stampa_in_ric_tutore2` (BOOLEAN)
- **Sanitario:** `tipo_visita` (VARCHAR), `visita_presso` (VARCHAR), `scadenza_tess_sanit` (DATE). Note: `medical_certificate_expiry`, `consent_certificate`, `health_notes` esistono già.
- **Società/Lavoro cliente:** `societa_provenienza` (VARCHAR), `societa_riferimento` (VARCHAR).

### 🔵 Trasferire_team_employees (Dati Staff e Insegnanti)
*Tutto ciò che riguarda i dipendenti (inclusi i contatti e i social) viene spostato da `members` a `team_employees`.*
- **Compensi/Fiscale staff:** `tipo_compenso` (VARCHAR), `p_iva` (VARCHAR), `conto_collab` (VARCHAR), `perc_add_comunale` (DECIMAL), `perc_add_regionale` (DECIMAL), `comp_ric_da_terzi` (BOOLEAN), `mail_pec_professionale` (VARCHAR). (Il `compenso` mapperà su `stipendio_fisso_mensile` o `tariffa_oraria`).
- **Albo/Professione:** `albo_matricola` (VARCHAR), `albo_tipo` (VARCHAR), `albo_sezione` (VARCHAR), `albo_numero` (VARCHAR), `albo_data_iscrizione` (DATE), `albo_scad_pratic` (DATE).
- **Istruzione:** `titolo_studio` (VARCHAR), `titolo_studio_data` (DATE), `istituto` (VARCHAR), `titolo_2` (VARCHAR).
- **Contatti Professionali e Social:** `facebook_id` (VARCHAR), `instagram_url` (VARCHAR), `tiktok_url` (VARCHAR), `youtube_url` (VARCHAR), `sito_web_url` (VARCHAR), `curriculum_url` (VARCHAR), `regolamento_url` (VARCHAR), `nota_collab` (TEXT).

### 🟡 Marginali_extra_data_members (Basso Valore, mappati in JSON)
*Campi da droppare come colonne fisse su `members` e delegare al JSON `extra_data` per l'importazione storica dei soli clienti.*
- Misure Fisiche: `size_shirt`, `size_pants`, `size_shoes`, `height`, `weight`
- Veicolo: `car_plate`, `patente_tipo`, `patente_rilasciata_da`, `patente_scadenza`
- Emergenze: `emergency_contact1_name/phone/email` (e anche il 2 e il 3)
- Altri: `fax`, `qr_code`, `alias`, `note_tecniche`, `comp_ric_da_terzi` (se non staff).

### 🟢 Già_in_DB_fix_alias (Alias errati da correggere nell'Import Data)
- Indir. Domicilio → `domicileAddress`
- CAP Domic. → `domicilePostalCode`
- Citta Domicilio → `domicileCity`
- Provincia Domic. → `domicileProvince`
- Nazione Domic. → `domicileCountry`
- E-Mail 2 → `secondaryEmail`
- Cod. comune → `codiceCatastale`
- Consenso Privacy → `privacyAccepted`
- SMS → `consentSms`
- Cellulare Tutore → `genitore1Mobile`

### 🔴 Ignorare
- Campi del tutto vuoti e concettualmente non significativi (es. campi di tracciamento legacy interni obsoleti).

---

## 2. Audit DB `members`

Dall'ispezione della tabella `members` con i conteggi `NOT NULL`, emergono i candidati ovvi al **DROP**:
- **USATE:** `first_name`, `last_name`, `country`, `active`, `enrollment_status`, `staff_status`, `season` (92 records su 92 totali).
- **POCO USATE (ma valide):** `date_of_birth` (21), `city` (21), `email` (23), `card_number` (19).
- **OBSOLETE DA DROPPARE (Candidate allo split verso `team_employees` o JSON):**
  - **Fisiche (Extra Data JSON):** `size_shirt` (1), `size_pants` (1), `size_shoes` (1), `height` (1), `weight` (1)
  - **Veicoli (Extra Data JSON):** `car_plate` (0), `patente_tipo` (0), `patente_rilasciata_da` (0), `patente_scadenza` (0)
  - **Emergenze (Extra Data JSON):** `emergency_contact1_*` (0), `emergency_contact2_*` (0), `emergency_contact3_*` (0)
  - **Social e Competenze (Spostati a `team_employees`):** `social_facebook` (0), `social_instagram` (0), `social_tiktok` (0), `social_youtube` (0), `website` (5), `education_title` (0), `education_institute` (0), `education_date` (0), `p_iva` (0), `albo_tipo` (0), `albo_sezione` (0), `albo_numero` (0), `albo_data_iscrizione` (0)
  - **Legacy obsoleto (Extra Data JSON o Ignora):** `alias` (2), `document_issued_by` (0), `document_issue_date` (0)

## 3. Audit DB `team_employees`

- **USATE:** `id`, `member_id`, `user_id`, `display_order`, `team`, `attivo`, `tariffa_oraria` (16 records).
- **MANCANTI (Da aggiungere per Chiarimento B):**
  Tutti i campi fiscali (`p_iva`, `tipo_compenso`, ecc.), i social network (`facebook_id`, `instagram_url`, ecc.), le informazioni albo/istruzione e le URL dei documenti (`curriculum_url`, `regolamento_url`).

---

## 4. Proposte Migration (A/B/C/D/E)

### A. `ALTER members ADD COLUMN`
```sql
ALTER TABLE members ADD COLUMN cancellation_notes TEXT NULL;
ALTER TABLE members ADD COLUMN is_socio BOOLEAN DEFAULT 0;
ALTER TABLE members ADD COLUMN codice_mandato_rid VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN data_mandato_rid DATE NULL;
ALTER TABLE members ADD COLUMN mod_pagamento VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN fattura_v_azienda BOOLEAN DEFAULT 0;
ALTER TABLE members ADD COLUMN permesso_soggiorno VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN permesso_soggiorno_scadenza DATE NULL;
ALTER TABLE members ADD COLUMN permesso_soggiorno_rilasciato_da VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN permesso_soggiorno_data_rilascio DATE NULL;
ALTER TABLE members ADD COLUMN documento_tutore1 VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN scadenza_doc_tutore1 DATE NULL;
ALTER TABLE members ADD COLUMN stampa_in_ric_tutore1 BOOLEAN DEFAULT 0;
ALTER TABLE members ADD COLUMN documento_tutore2 VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN scadenza_doc_tutore2 DATE NULL;
ALTER TABLE members ADD COLUMN stampa_in_ric_tutore2 BOOLEAN DEFAULT 0;
ALTER TABLE members ADD COLUMN tipo_visita VARCHAR(100) NULL;
ALTER TABLE members ADD COLUMN visita_presso VARCHAR(255) NULL;
ALTER TABLE members ADD COLUMN scadenza_tess_sanit DATE NULL;
ALTER TABLE members ADD COLUMN societa_provenienza VARCHAR(255) NULL;
ALTER TABLE members ADD COLUMN societa_riferimento VARCHAR(255) NULL;
```

### B. `ALTER team_employees ADD COLUMN` (Chiarimento B ⭐)
```sql
ALTER TABLE team_employees ADD COLUMN facebook_id VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN instagram_url VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN tiktok_url VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN youtube_url VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN sito_web_url VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN mail_pec_professionale VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN curriculum_url VARCHAR(500) NULL;
ALTER TABLE team_employees ADD COLUMN regolamento_url VARCHAR(500) NULL;
ALTER TABLE team_employees ADD COLUMN albo_matricola VARCHAR(100) NULL;
ALTER TABLE team_employees ADD COLUMN albo_tipo VARCHAR(100) NULL;
ALTER TABLE team_employees ADD COLUMN albo_sezione VARCHAR(100) NULL;
ALTER TABLE team_employees ADD COLUMN albo_numero VARCHAR(100) NULL;
ALTER TABLE team_employees ADD COLUMN albo_data_iscrizione DATE NULL;
ALTER TABLE team_employees ADD COLUMN albo_scad_pratic DATE NULL;
ALTER TABLE team_employees ADD COLUMN titolo_studio VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN titolo_studio_data DATE NULL;
ALTER TABLE team_employees ADD COLUMN istituto VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN titolo_2 VARCHAR(255) NULL;
ALTER TABLE team_employees ADD COLUMN tipo_compenso VARCHAR(100) NULL;
ALTER TABLE team_employees ADD COLUMN p_iva VARCHAR(50) NULL;
ALTER TABLE team_employees ADD COLUMN conto_collab VARCHAR(100) NULL;
ALTER TABLE team_employees ADD COLUMN perc_add_comunale DECIMAL(5,2) NULL;
ALTER TABLE team_employees ADD COLUMN perc_add_regionale DECIMAL(5,2) NULL;
ALTER TABLE team_employees ADD COLUMN comp_ric_da_terzi BOOLEAN DEFAULT 0;
ALTER TABLE team_employees ADD COLUMN nota_collab TEXT NULL;
```

### C. `ALTER members DROP COLUMN`
```sql
ALTER TABLE members DROP COLUMN p_iva, DROP COLUMN albo_tipo, DROP COLUMN albo_sezione, DROP COLUMN albo_numero, DROP COLUMN albo_data_iscrizione, DROP COLUMN patente_tipo, DROP COLUMN patente_rilasciata_da, DROP COLUMN patente_scadenza, DROP COLUMN car_plate, DROP COLUMN size_shirt, DROP COLUMN size_pants, DROP COLUMN size_shoes, DROP COLUMN height, DROP COLUMN weight, DROP COLUMN social_facebook, DROP COLUMN social_instagram, DROP COLUMN social_tiktok, DROP COLUMN social_youtube, DROP COLUMN website, DROP COLUMN education_title, DROP COLUMN education_institute, DROP COLUMN education_date, DROP COLUMN emergency_contact1_name, DROP COLUMN emergency_contact1_phone, DROP COLUMN emergency_contact1_email, DROP COLUMN emergency_contact2_name, DROP COLUMN emergency_contact2_phone, DROP COLUMN emergency_contact2_email, DROP COLUMN emergency_contact3_name, DROP COLUMN emergency_contact3_phone, DROP COLUMN emergency_contact3_email, DROP COLUMN alias;
```

### D. Alias dictionary updates (`import-data.tsx`)
```typescript
domicileAddress: ["indir. domicilio", "indirdomicilio", "indirizzodomicilio"],
domicilePostalCode: ["cap domic.", "capdomicilio", "capdomic"],
domicileCity: ["citta domicilio", "città domicilio", "cittadomicilio"],
domicileProvince: ["provincia domic.", "provinciadomicilio"],
domicileCountry: ["nazione domic.", "nazionedomicilio"],
secondaryEmail: ["e-mail 2", "email 2"],
codiceCatastale: ["cod. comune"],
privacyAccepted: ["consenso privacy"],
consentSms: ["sms"],
genitore1Mobile: ["cellulare tutore"]
```

### E. `MEMBER_FIELDS` UI updates
- Aggiornamento della costante `MEMBER_FIELDS` con le 21 nuove opzioni dropdown mappate sui nuovi campi DB.
- **Bonus UX Proposal:** Aggiungere una validazione/alert post-auto-mapping: se il file CSV contiene campi mappati su colonne destinate a `team_employees` (es. "P.IVA" o "Titolo Studio"), avvisare l'utente che: *"Stai importando dati Staff. Assicurati che l'opzione 'Imposta come Insegnante/Staff' sia attiva, o procedi su un import batch separato."*

---

## 5. Stima Impatto

- **Aggiunte a `members`:** +21 colonne.
- **Rimosse da `members`:** -32 colonne.
- **Aggiunte a `team_employees`:** +25 colonne.
- **Saldo `members`:** La tabella `members` **si snellisce di 11 colonne**, alleggerendo sensibilmente il `Row Size` di InnoDB e compensando abbondantemente lo spazio richiesto per le nuove colonne di ciclo vita.
- **Mappatura CSV (`import-data.tsx`):** I campi attivi mappabili via UI copriranno l'esigenza dell'auto-mapping senza riempire il json extra_data, coprendo quasi il 95% delle celle del CSV storico con logica fully-typed.

---

## 6. Domande Operative per Gaetano

1. **Gestione Società:** Il campo "Società di Provenienza" è sufficiente come stringa libera (VARCHAR) o vogliamo incrociarlo con la tabella strutturata `societies` creata in F1-017 per il welfare aziendale?
2. **Modulo Pagamenti:** Il campo "Mod. Pagamento" (che arriva dal CSV anagrafica) rappresenta la *preferenza predefinita* del socio e va messo in `members`, oppure andrà mappato direttamente sugli storici transazionali (`payments`) del singolo rinnovo?
3. **Migrazione Dati Esistenti:** Prima del `DROP` di colonne da `members` (come il website che conta 5 non-null), autorizzi la stesura di un `UPDATE` query per travasare i valori da `members` a `team_employees` per i dipendenti, per non perdere questi 5 record?

---

## 7. Roadmap F1-030 (Esecuzione Migration)
1. **Approvazione:** Risposta alle 3 domande operative.
2. **Sync Drizzle:** Aggiornamento di `shared/schema.ts` riflettendo fedelmente i punti A, B e C.
3. **Backup & Migrazione SQL:** Creazione script raw SQL per travaso dati (se richiesto dalla domanda 3) e successiva exec degli statement `ALTER TABLE`.
4. **Update Frontend UI:** Aggiornamento di `import-data.tsx` per supportare tutti i nuovi campi e alias del Chiarimento A+B.
