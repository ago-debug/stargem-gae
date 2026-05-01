SHOW COLUMNS FROM members;

SELECT COUNT(*) AS totale_members FROM members;
SELECT COUNT(*) AS con_cf FROM members WHERE fiscal_code IS NOT NULL AND fiscal_code != '';
SELECT COUNT(*) AS con_email FROM members WHERE email IS NOT NULL AND email != '';
SELECT COUNT(*) AS con_tutor1 FROM members WHERE tutor1_fiscal_code IS NOT NULL;
SELECT COUNT(*) AS con_nationality FROM members WHERE nationality IS NOT NULL AND nationality != '';
SELECT COUNT(*) AS con_consent_image FROM members WHERE consent_image IS NOT NULL;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND TABLE_NAME = 'members'
ORDER BY ORDINAL_POSITION;

SELECT
  id, first_name, last_name,
  tutor1_fiscal_code, tutor1_phone, tutor1_email,
  tutor2_fiscal_code,
  nationality, region,
  consent_image, consent_marketing,
  enrollment_status
FROM members
WHERE tutor1_fiscal_code IS NOT NULL
LIMIT 5;
