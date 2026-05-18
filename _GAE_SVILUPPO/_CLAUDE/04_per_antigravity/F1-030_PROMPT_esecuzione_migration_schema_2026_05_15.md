---
aggiornato: 2026-05-15T18:00
tipo: prompt-AG-refactor
target: AG-F1 (backend)
stima: ~3h
note: prompt esecutivo F1-030 — applica proposte [[audit_F1-029v2_cleanup_extension_schema_2026_05_15]] con 3 decisioni Gaetano acquisite
---

# F1-030 — Esecuzione migration cleanup+extension schema

```
F1-030 — Migration cleanup+extension schema members + team_employees (apply patches ~3h)

CONTESTO:
Audit F1-029 V2 chiuso: report _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F1-029v2_cleanup_extension_schema_2026_05_15.md.
Gaetano ha risposto le 3 domande operative con tutte e 3 le opzioni Recommended.
Obiettivo: applicare schema cleanup (-32 col members obsolete) + extension (+21 col members + 25 col team_employees) per portare auto-mapping CSV import da ~74% a ~95% e abilitare Lotto 1 anagrafica (3986 record Athena).

OBIETTIVO: schema members più snello (net -11 col) + team_employees completo + alias dict aggiornato, pronto per import Lotto 1.

DECISIONI GAETANO ACQUISITE:
- Q1 Società di Provenienza → FK su tabella `societies` (NON VARCHAR libero)
  Campo: `society_provenienza_id INT NULL` con FK constraint a `societies(id)` ON DELETE SET NULL
- Q2 Mod. Pagamento Preferita → su `members` (preferenza utente)
  Storia pagamenti reali resta su `payments.method`, mai duplicata
- Q3 5 record website su members.facebook/instagram → UPDATE pre-DROP
  Travasare a `team_employees.website` PRIMA del DROP delle 32 colonne

═══ PATCH A — Migration members ADD x21 ═══

A.1 — Backup DB obbligatorio (Regola 25)
  mysqldump --single-transaction stargem_db > backup_pre_F1-030_2026_05_15.sql

A.2 — Migration script `migrations/F1-030_A_members_add21.sql` IDEMPOTENTE (Regola 26)
  Aggiungere a `members` (usa `IF NOT EXISTS` o check DESCRIBE):
    - status_lifecycle ENUM('attivo','sospeso','dimesso','deceduto') DEFAULT 'attivo'
    - data_iscrizione DATE NULL
    - data_dimissione DATE NULL
    - causa_dimissione TEXT NULL
    - codice_destinatario VARCHAR(7) NULL    -- SDI fatturazione
    - pec VARCHAR(255) NULL
    - iban VARCHAR(34) NULL
    - intestatario_iban VARCHAR(255) NULL
    - mod_pagamento_preferita ENUM('contanti','bonifico','pos','sdd','assegno','altro') NULL
    - data_certificato_medico DATE NULL
    - tipologia_certificato ENUM('non_agonistico','agonistico','sportivo') NULL
    - allergie TEXT NULL
    - patologie TEXT NULL
    - farmaci TEXT NULL
    - note_sanitarie TEXT NULL
    - taglia_abbigliamento VARCHAR(10) NULL
    - numero_scarpe VARCHAR(10) NULL
    - society_provenienza_id INT NULL    -- FK Q1 decisione
    - data_tesseramento_precedente DATE NULL
    - note_provenienza TEXT NULL
    - flag_minore_protetto TINYINT(1) DEFAULT 0

A.3 — FK constraint society_provenienza_id
  ALTER TABLE members ADD CONSTRAINT fk_members_society_provenienza
    FOREIGN KEY (society_provenienza_id) REFERENCES societies(id) ON DELETE SET NULL;

A.4 — Verifica Drizzle ↔ DB allineamento (Regola 23)
  - Aggiornare `shared/schema.ts` con i 21 nuovi campi
  - `npx tsc --noEmit` → exit 0
  - Smoke test: GET /api/members/19308 → deve restituire i nuovi campi (null per ora)

═══ PATCH B — Migration team_employees ADD x25 ═══

B.1 — Migration script `migrations/F1-030_B_team_add25.sql` IDEMPOTENTE
  Aggiungere a `team_employees`:
    - compenso_orario DECIMAL(8,2) NULL
    - compenso_mensile DECIMAL(10,2) NULL
    - tipologia_contratto ENUM('dipendente','collab_occasionale','collab_continuativa','partita_iva','volontario') NULL
    - data_inizio_collaborazione DATE NULL
    - data_fine_collaborazione DATE NULL
    - albo_professionale VARCHAR(255) NULL
    - n_iscrizione_albo VARCHAR(100) NULL
    - data_iscrizione_albo DATE NULL
    - titolo_studio VARCHAR(255) NULL
    - istituto_diploma VARCHAR(255) NULL
    - anno_diploma YEAR NULL
    - certificazioni TEXT NULL
    - linkedin_url VARCHAR(500) NULL
    - instagram_url VARCHAR(500) NULL
    - facebook_url VARCHAR(500) NULL
    - website VARCHAR(500) NULL    -- Q3: riceve travaso pre-DROP
    - curriculum_url VARCHAR(500) NULL
    - regolamento_url VARCHAR(500) NULL
    - bio_breve TEXT NULL
    - specializzazione VARCHAR(255) NULL
    - lingue_parlate VARCHAR(255) NULL
    - disponibilita_oraria TEXT NULL
    - note_compenso TEXT NULL
    - foto_profilo_url VARCHAR(500) NULL
    - colore_calendario VARCHAR(7) NULL    -- #RRGGBB

B.2 — Aggiornare `shared/schema.ts` team_employees
B.3 — `npx tsc --noEmit` → exit 0

═══ PATCH C — UPDATE pre-DROP + DROP 32 col members ═══

C.1 — UPDATE 5 record website (Q3 decisione)
  Pre-script: identificare i 5 record con website in members.facebook/instagram/website
  SQL:
    UPDATE team_employees te
    JOIN members m ON te.member_id = m.id
    SET te.website = COALESCE(m.website, m.facebook, m.instagram)
    WHERE (m.website IS NOT NULL OR m.facebook LIKE 'http%' OR m.instagram LIKE 'http%')
      AND te.website IS NULL;

C.2 — Grep preventivo (Regola 24) prima DROP
  Per ogni colonna da droppare, grep nel codice:
    grep -rn "\.mother_" client/ server/ shared/
    grep -rn "\.father_" client/ server/ shared/
    grep -rn "\.specialization" client/ server/ shared/
    [...e così via per tutte e 32]
  Se trova match → REPORT prima di droppare, NON droppare a freddo.

C.3 — Migration script `migrations/F1-030_C_members_drop32.sql` IDEMPOTENTE
  DROP COLUMN (32 colonne identificate in audit F1-029 V2):
    Social/contatti obsoleti: facebook, instagram, twitter, linkedin, website, skype
    Fisico/biometria: altezza, peso, gruppo_sanguigno, mancino_destro
    Auto/veicoli: auto_marca, auto_modello, auto_targa, auto_colore
    Emergenze duplicate: emergency_contact_old, emergency_phone_old, emergency_relation_old
    Mother/father legacy: mother_name, mother_phone, mother_email, mother_cf, father_name, father_phone, father_email, father_cf
    Permit/specialization: residence_permit, specialization, hourly_rate, bio
    Altri: nickname, hobby_principale, sport_praticati
    [completare lista esatta da audit F1-029 V2]

C.4 — Aggiornare `shared/schema.ts` removendo i 32 campi
C.5 — `npx tsc --noEmit` → exit 0 + check `server/storage.ts` + `server/routes/*.ts` (Regola 27)

═══ PATCH D — Update alias dictionary import-data.tsx ═══

D.1 — `client/src/pages/import-data.tsx`:
  - Estendere `MEMBER_FIELDS` con i 21 nuovi campi (label IT + key snake_case)
  - Estendere `ALIAS_DICTIONARY` con varianti CSV Athena/Master per i nuovi campi:
    es. "Codice Destinatario" / "Codice SDI" / "SDI" → codice_destinatario
        "Cert. Medico" / "Data Cert" / "Certificato" → data_certificato_medico
        "IBAN" / "Coordinate Bancarie" → iban
        "Società di Provenienza" / "Provenienza" / "Soc. Prec." → society_provenienza_id
        [completare per tutti e 21]
  - `calculateAutoMapping`: nessun cambio logico, basta che pesca i nuovi alias

D.2 — Build frontend: `npm run build` → exit 0

═══ PATCH E — Cleanup file scratch (Regola 28) ═══

E.1 — Identificare file scratch/test/fix prodotti durante F1-022→F1-029
  ls scripts/ | grep -E '^(fix_|test_|scratch_|tmp_)'
E.2 — Spostare in `99_archivio/2026_05_15_scratch_F1-022-029/` (NON eliminare)

═══ TEST OBBLIGATORI ═══

- `npx tsc --noEmit` exit 0 (Regola 14)
- `npm test` (se test suite esiste) — tutti verdi
- Smoke test endpoint (Regola 23):
    curl http://localhost:5173/api/members/19308 → check nuovi campi nel JSON
    curl http://localhost:5173/api/team-employees/<id> → check nuovi campi
- Verifica /calendario-attivita NON regredisce (regressione F1-028 risolta)
- Verifica /importa carica 50 record Athena di test → mapping ~95% auto

═══ DELIVERABLE ═══

Report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-030_migration_schema_2026_05_15.md

Contenuto:
1. SQL Patch A/B/C applicato (file:linea, prima/dopo)
2. Grep preventivo Patch C: matches trovati per ogni colonna droppata + decisione (refactor o conferma drop)
3. UPDATE Patch C.1: numero record travasati (atteso ~5)
4. Risultati test (tsc + smoke test endpoint + import test 50 record)
5. Cleanup Patch E: file scratch archiviati
6. Eventuali side effect rilevati (frontend/storage/routes che usavano col droppate)
7. Sintesi auto-mapping post-F1-030: % auto-mapped su CSV Athena

═══ VINCOLI ═══

- Regola 14: tsc 0
- Regola 15: aggiornare F_*_ULTIMI_AGGIORNAMENTI (rinomina timestamp)
- Regola 17: frontmatter con ora
- Regola 22: wikilink solo file vault
- Regola 23: smoke test endpoint dopo migration
- Regola 24: grep preventivo prima DROP/RENAME (Patch C.2)
- Regola 25: backup DB obbligatorio (Patch A.1)
- Regola 26: migration scripts IDEMPOTENTI (IF NOT EXISTS, check DESCRIBE)
- Regola 27: sync schema.ts + storage.ts + routes.ts
- Regola 28: cleanup scratch (Patch E)
- NO modifiche frontend extra (solo import-data.tsx + alias dict)
- NO modifiche al flow /importa logico (solo MEMBER_FIELDS + ALIAS_DICTIONARY)

Stop & Go a fine.
```

---

## Note di coordinamento Cowork

- F1-030 lanciato dopo F1-029 V2 chiuso (audit) + risposte Gaetano alle 3 Q.
- In parallelo: F2-019 ([[F2-019_PROMPT_innesto_storia_provenienza_pulizia_root]]) sta innestando Tab Storia&Provenienza + pulendo root.
- Quando entrambi chiudono → ricarica CSV `/importa` → atteso ~95% auto-mapped → Step 3 import 3986 Athena.
- Backup obbligatorio prima dello stop&go (sotto regola 25).
