---
aggiornato: 2026-05-15T20:00
tipo: prompt-AG-refactor
target: AG-F1 (backend)
stima: ~6-8h
note: prompt F1-031 — backend self-service tesseramento (tabelle + token + endpoint + PDF + approval queue)
fonti:
  - "[[utenti_Domanda_Tesseramento-set-2025]]" (10_utenti_GemPortal)
  - "[[utenti_Privacy-e-Liberatoria-Immagine-adulti]]"
  - "[[utenti_Privacy-e-Liberatoria-Immagine-minori]]"
  - "[[utenti_FAC-SIMILE-CERTIFICATO-NON-AGONISTICO-STUDIO-GEM]]"
  - "[[classificazione_utenti_2026_05_13bis]]"
---

# F1-031 — Self-service Tesseramento BE (tabelle + token + endpoint + PDF + approval)

```
F1-031 — Self-service Tesseramento BACKEND (apply patches ~6-8h)

CONTESTO:
Gaetano richiede 3 canali sincronizzati di compilazione domanda tesseramento GEOS:
(1) Kiosk tablet in segreteria (PIN sblocco operatore, sessione effimera, no auth utente)
(2) Link pubblico tokenizzato via email/QR/sito (token monouso 7gg)
(3) Area utente loggata (rinnovi + modifiche dati)
Tutti e 3 convergono su stessa entità `membership_application` con status workflow
unificato e coda "Da approvare" in segreteria.

Fonte autoritativa dei campi: 4 PDF in _CLAUDE/05_allegati/10_utenti_GemPortal/
- Domanda Tesseramento set-2025 (campi anagrafici + dichiarazione adesione + regolamento)
- Privacy e Liberatoria Immagine adulti (marketing/foto/video consensi)
- Privacy e Liberatoria Immagine minori (firma genitore + nome minore)
- Certificato medico NON agonistico (DM 24/04/2013 GU 169 del 20/07/2013)

OBIETTIVO: tabelle + endpoint + token gen + PDF gen + approval queue BE, ready per FE F2-024.

═══ PATCH A — Schema nuove tabelle ═══

A.1 — Backup DB (Regola 25)
A.2 — Migration script `migrations/F1-031_A_membership_applications.sql` IDEMPOTENTE

  TABLE membership_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_uuid VARCHAR(36) UNIQUE NOT NULL,    -- per token URL pubblico
    tenant_id VARCHAR(50) DEFAULT '1',

    -- Channel & source
    channel ENUM('kiosk','public_link','user_area') NOT NULL,
    source_token VARCHAR(255) NULL,    -- token monouso se public_link
    kiosk_operator_id VARCHAR(50) NULL,    -- PIN segreteria se kiosk
    parent_application_id INT NULL,    -- per applicazione famiglia (madre + N figli)

    -- Tesserato (anagrafica)
    cognome VARCHAR(100) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    sesso ENUM('M','F') NOT NULL,
    luogo_nascita VARCHAR(255) NOT NULL,
    data_nascita DATE NOT NULL,
    residenza_citta VARCHAR(255) NOT NULL,
    residenza_via VARCHAR(255) NOT NULL,
    residenza_civico VARCHAR(20) NOT NULL,
    residenza_cap VARCHAR(10) NOT NULL,
    codice_fiscale VARCHAR(16) NULL,    -- placeholder se stranieri (regola CF policy F1-021b)
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_minore TINYINT(1) DEFAULT 0,

    -- Genitore 1 (obbligatorio se minore — NB nomenclatura GENITORE non TUTORE)
    genitore1_cognome VARCHAR(100) NULL,
    genitore1_nome VARCHAR(100) NULL,
    genitore1_luogo_nascita VARCHAR(255) NULL,
    genitore1_data_nascita DATE NULL,
    genitore1_residenza_citta VARCHAR(255) NULL,
    genitore1_residenza_via VARCHAR(255) NULL,
    genitore1_residenza_civico VARCHAR(20) NULL,
    genitore1_residenza_cap VARCHAR(10) NULL,
    genitore1_cf VARCHAR(16) NULL,
    genitore1_telefono VARCHAR(30) NULL,
    genitore1_email VARCHAR(255) NULL,

    -- Genitore 2 (obbligatorio se minore secondo regolamento art. **N.B.)
    genitore2_cognome VARCHAR(100) NULL,
    genitore2_nome VARCHAR(100) NULL,
    genitore2_luogo_nascita VARCHAR(255) NULL,
    genitore2_data_nascita DATE NULL,
    genitore2_residenza_citta VARCHAR(255) NULL,
    genitore2_residenza_via VARCHAR(255) NULL,
    genitore2_residenza_civico VARCHAR(20) NULL,
    genitore2_residenza_cap VARCHAR(10) NULL,
    genitore2_cf VARCHAR(16) NULL,
    genitore2_telefono VARCHAR(30) NULL,
    genitore2_email VARCHAR(255) NULL,

    -- Come ci hai conosciuti
    fonte_conoscenza ENUM('social','internet','passaparola','volantini','altro') NULL,
    fonte_conoscenza_dettaglio VARCHAR(255) NULL,    -- se 'altro'

    -- Consensi (privacy + marketing + foto)
    consenso_dati_obbligatorio TINYINT(1) DEFAULT 1,    -- sempre 1, è base contrattuale
    consenso_marketing TINYINT(1) NULL,    -- email/SMS commerciali
    consenso_indagini TINYINT(1) NULL,    -- indagini mercato
    consenso_foto_video TINYINT(1) NULL,    -- liberatoria immagine
    consenso_comunicazione_categorie TINYINT(1) NULL,    -- comunicazione a partner

    -- Firma regolamento (1341/1342 CC)
    firma_regolamento_specifica TINYINT(1) DEFAULT 0,    -- doppia firma art specifici

    -- Certificato medico
    certificato_medico_url VARCHAR(500) NULL,
    certificato_medico_data_emissione DATE NULL,
    certificato_medico_data_scadenza DATE NULL,    -- emissione + 1 anno
    certificato_medico_tipo ENUM('non_agonistico','agonistico') DEFAULT 'non_agonistico',
    certificato_medico_medico_nome VARCHAR(255) NULL,

    -- Firma digitale touch
    firma_digitale_tesserato_url VARCHAR(500) NULL,    -- PNG canvas
    firma_digitale_genitore1_url VARCHAR(500) NULL,
    firma_digitale_genitore2_url VARCHAR(500) NULL,
    firma_data DATE NULL,
    firma_ip VARCHAR(45) NULL,
    firma_user_agent TEXT NULL,

    -- PDF finale generato
    pdf_domanda_url VARCHAR(500) NULL,
    pdf_privacy_url VARCHAR(500) NULL,
    pdf_liberatoria_url VARCHAR(500) NULL,
    pdf_riepilogo_url VARCHAR(500) NULL,    -- merge dei 3 above

    -- Status workflow
    status ENUM('draft','submitted','pending_approval','approved','rejected','expired') NOT NULL DEFAULT 'draft',
    submitted_at DATETIME NULL,
    approved_at DATETIME NULL,
    approved_by VARCHAR(50) NULL,    -- operatore segreteria
    rejected_at DATETIME NULL,
    rejected_by VARCHAR(50) NULL,
    rejection_reason TEXT NULL,

    -- Pagamento differito (sblocca dopo approval)
    payment_status ENUM('pending_payment','partial','paid','waived') DEFAULT 'pending_payment',
    payment_method ENUM('cash','bank_transfer','pos','stripe','gift_card','welfare') NULL,
    payment_id INT NULL,    -- FK a payments quando incassato

    -- Conversion to member
    converted_member_id INT NULL,    -- FK a members dopo approval
    converted_at DATETIME NULL,

    -- Stagione
    stagione VARCHAR(10) NOT NULL DEFAULT '2526',    -- es. 2526 = 25/26
    cod_corso VARCHAR(50) NULL,    -- opzionale, pre-compilato se da link tokenizzato corso-specifico

    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    last_step_completed INT DEFAULT 0,    -- per riprendere wizard
    INDEX idx_uuid (application_uuid),
    INDEX idx_status (status, payment_status),
    INDEX idx_channel (channel),
    INDEX idx_stagione (stagione)
  );

A.3 — Migration `migrations/F1-031_A2_application_tokens.sql`

  TABLE application_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) UNIQUE NOT NULL,    -- crypto random 32 byte hex
    tenant_id VARCHAR(50) DEFAULT '1',
    purpose ENUM('public_link','kiosk_session') NOT NULL,
    application_id INT NULL,    -- collegato a un'application esistente o NULL per nuovo
    pre_filled_data JSON NULL,    -- es. {cognome, nome, cod_corso} se invitato segreteria
    created_by VARCHAR(50) NULL,    -- operatore che ha generato
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,    -- default +7gg
    used_at DATETIME NULL,
    is_revoked TINYINT(1) DEFAULT 0,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
  );

A.4 — Migration `migrations/F1-031_A3_kiosk_operators.sql`

  TABLE kiosk_operators (
    id VARCHAR(50) PRIMARY KEY,    -- es. 'op_ELISA', 'op_SARA'
    tenant_id VARCHAR(50) DEFAULT '1',
    nome VARCHAR(100) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,    -- bcrypt
    is_active TINYINT(1) DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

A.5 — Aggiornare shared/schema.ts con le 3 nuove tabelle Drizzle
A.6 — npx tsc --noEmit exit 0 (Regola 14)

═══ PATCH B — Endpoint REST ═══

B.1 — `server/routes/membership_applications.ts`

  POST /api/membership-applications/draft
    body: { channel, source_token?, kiosk_operator_id?, parent_application_id? }
    → crea draft, ritorna application_uuid
    NO AUTH per kiosk/public_link, AUTH session per user_area

  PATCH /api/membership-applications/:uuid
    body: { step_data }    -- update incrementale per step
    → aggiorna campi, increment last_step_completed
    AUTH token-based o session

  POST /api/membership-applications/:uuid/upload-certificate
    multipart certificate_medico
    → salva in /uploads/certificates/<uuid>.pdf
    → set certificato_medico_url + data_emissione + data_scadenza

  POST /api/membership-applications/:uuid/sign
    body: { signature_tesserato_base64, signature_genitore1?, signature_genitore2? }
    → salva firme PNG, set firma_data + firma_ip + user_agent
    → genera 3 PDF (domanda + privacy + liberatoria) + 1 riepilogo merged
    → set status='pending_approval', submitted_at=NOW()

  GET /api/membership-applications/queue?status=pending_approval
    AUTH session segreteria
    → ritorna lista applications da approvare ordinate per submitted_at

  POST /api/membership-applications/:id/approve
    AUTH session segreteria + role segreteria
    body: { approved_by, note? }
    → crea member in `members` con dati copiati
    → set converted_member_id, converted_at
    → status='approved'

  POST /api/membership-applications/:id/reject
    body: { rejected_by, rejection_reason }
    → status='rejected'
    → email notifica utente con reason

  GET /api/membership-applications/:uuid
    AUTH token o session
    → ritorna dati application per resume wizard

═══ PATCH C — Endpoint tokens (link pubblico + kiosk) ═══

C.1 — `server/routes/application_tokens.ts`

  POST /api/application-tokens/public-link
    AUTH session segreteria
    body: { pre_filled_data?, expires_days=7 }
    → genera token random 32byte hex
    → ritorna { token, full_url: 'https://app/iscrizione/start/<token>' }

  POST /api/application-tokens/kiosk-session
    body: { kiosk_operator_id, pin }
    → verifica PIN bcrypt
    → genera token kiosk_session valido 4h
    → ritorna token (frontend lo mette in localStorage del kiosk)

  GET /api/application-tokens/:token/validate
    → ritorna { valid, expires_at, pre_filled_data, purpose }

═══ PATCH D — Servizio generazione PDF ═══

D.1 — `server/services/pdfGenerator.ts`
  Tools: pdfkit o puppeteer (decisione AG, raccomando pdfkit per perf)

  generateDomandaTesseramentoPdf(application) → buffer PDF
    Template: replica esatta del PDF cartaceo PDF set-2025
    Campi pre-compilati: cognome, nome, nato, data, residenza, CF, cell, email
    Sezione genitori se is_minore
    Footer: regolamento interno completo (sezioni 1-14, modalità iscrizione 1-16, certificato medico, orario, spogliatoi)
    Firme: inserire PNG firme da firma_digitale_*_url

  generatePrivacyPdf(application) → buffer
    Template: replica PDF privacy adulti o minori in base a is_minore
    Checkbox: render acconsente/non acconsente da consenso_*

  generateLiberatoriaImaginePdf(application) → buffer
    Template: replica liberatoria
    Consensi foto/video

  generateRiepilogoPdf(application) → buffer
    Merge dei 3 PDF sopra + certificato medico + dichiarazione completezza

D.2 — Salvare in `/uploads/applications/<uuid>/`:
  - domanda.pdf
  - privacy.pdf
  - liberatoria.pdf
  - riepilogo.pdf

═══ PATCH E — Job approval → conversion to member ═══

E.1 — Quando admin chiama /approve:
  - INSERT INTO members (cognome, nome, sesso, ..., genitore1_*, genitore2_*) FROM application
  - copia certificato_medico_* in members
  - link members.legacy_athena_id = NULL (è nuovo)
  - INSERT memberships (member_id, stagione, status='active', start_date=NOW, end_date='2026-08-31')
  - Set application.converted_member_id e converted_at
  - Trigger email notifica con link Stripe se payment_status='pending_payment'

═══ TEST OBBLIGATORI ═══

- npx tsc --noEmit exit 0 (Regola 14)
- Smoke test endpoint (Regola 23):
  curl POST /api/application-tokens/public-link → ottieni token
  curl POST /api/membership-applications/draft → ottieni uuid
  curl PATCH /api/membership-applications/<uuid> con dati step1
  curl POST /api/membership-applications/<uuid>/sign → verifica generazione 4 PDF
  curl POST /api/membership-applications/<id>/approve → verifica creazione member
- Verifica PDF generati apribili con Adobe Reader (non corrotti)

═══ DELIVERABLE ═══

Report in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-031_self_service_tesseramento_BE_2026_05_15.md

Contenuto:
1. Schema 3 nuove tabelle (DDL applicato)
2. 13 endpoint creati + payload examples
3. PDF gen samples (allegare 4 PDF generati su dati fake)
4. Diff shared/schema.ts (Drizzle)
5. Risultati smoke test
6. Side effect rilevati
7. NOTA per F2-024 FE: handshake esatto token + sequenza chiamate

═══ VINCOLI ═══

- Regola 13: tenant_id default '1'
- Regola 14: tsc 0
- Regola 15: aggiornare F_*_ULTIMI_AGGIORNAMENTI
- Regola 17: frontmatter ora
- Regola 22: wikilink vault
- Regola 23: smoke test endpoint
- Regola 25: backup DB
- Regola 26: migration IDEMPOTENTI
- Regola 27: sync schema.ts + storage.ts + routes.ts
- Nomenclatura GENITORE non TUTORE su tutti i campi
- CF policy F1-021b (placeholder stranieri PLC-STR-NNNN)
- Riusare ENUM patterns già in schema

Stop & Go a fine.
```
