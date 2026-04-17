-- Gruppo A: anagrafica integrativa
ALTER TABLE members
  ADD COLUMN birth_nation VARCHAR(100) NULL AFTER birth_province,
  ADD COLUMN secondary_email VARCHAR(255) NULL AFTER email,
  ADD COLUMN profession VARCHAR(100) NULL AFTER from_where;

-- Gruppo B: documento identità
ALTER TABLE members
  ADD COLUMN document_type VARCHAR(50) NULL AFTER profession,
  ADD COLUMN document_expiry DATE NULL AFTER document_type;

-- Gruppo C: privacy e consensi
ALTER TABLE members
  ADD COLUMN privacy_date DATE NULL AFTER privacy_accepted,
  ADD COLUMN consent_newsletter TINYINT(1) NOT NULL DEFAULT 0
    AFTER consent_marketing;

-- Gruppo D: note interne e sanitarie
ALTER TABLE members
  ADD COLUMN admin_notes TEXT NULL AFTER notes,
  ADD COLUMN health_notes TEXT NULL AFTER admin_notes,
  ADD COLUMN food_alerts VARCHAR(255) NULL AFTER health_notes;

-- Gruppo E: CRM e permesso soggiorno
ALTER TABLE members
  ADD COLUMN tags VARCHAR(500) NULL AFTER food_alerts,
  ADD COLUMN residence_permit VARCHAR(100) NULL AFTER tags,
  ADD COLUMN residence_permit_expiry DATE NULL AFTER residence_permit;

-- VERIFICA IMMEDIATA POST-ALTER
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME = 'members'
  AND COLUMN_NAME IN (
    'birth_nation','secondary_email','profession',
    'document_type','document_expiry','privacy_date',
    'consent_newsletter','admin_notes','health_notes',
    'food_alerts','tags','residence_permit',
    'residence_permit_expiry'
  )
ORDER BY ORDINAL_POSITION;

-- CONTEGGIO TOTALE COLONNE
SELECT COUNT(*) AS totale_colonne
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME = 'members';

-- RECORD INVARIATI
SELECT COUNT(*) AS totale_members FROM members;
