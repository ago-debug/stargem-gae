#!/bin/bash
ssh root@82.165.35.145 "mysqldump -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 > /root/backups/pre_dedup_F1-005_\$(date +%Y%m%d_%H%M).sql && echo 'BACKUP OK' && ls -lh /root/backups/pre_dedup_F1-005_*.sql | tail -1"

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  COUNT(*) AS gruppi_cf_duplicati,
  SUM(cnt - 1) AS records_da_eliminare
FROM (
  SELECT fiscal_code, COUNT(*) AS cnt
  FROM members
  WHERE fiscal_code IS NOT NULL
    AND fiscal_code != ''
    AND active = 1
  GROUP BY fiscal_code
  HAVING COUNT(*) > 1
) sub;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  m.fiscal_code,
  m.id,
  m.first_name,
  m.last_name,
  m.email,
  m.phone,
  m.insertion_date,
  m.internal_id,
  (
    (m.email IS NOT NULL) +
    (m.phone IS NOT NULL) +
    (m.birth_nation IS NOT NULL) +
    (m.address IS NOT NULL) +
    (m.city IS NOT NULL) +
    (m.date_of_birth IS NOT NULL) +
    (m.nationality IS NOT NULL) +
    (m.region IS NOT NULL) +
    (m.consent_image IS NOT NULL) +
    (m.notes IS NOT NULL)
  ) AS completeness_score
FROM members m
WHERE m.fiscal_code IN (
  SELECT fiscal_code
  FROM members
  WHERE fiscal_code IS NOT NULL
    AND fiscal_code != ''
    AND active = 1
  GROUP BY fiscal_code
  HAVING COUNT(*) > 1
)
AND m.active = 1
ORDER BY m.fiscal_code, completeness_score DESC
LIMIT 20;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'stargem_v2'
  AND REFERENCED_TABLE_NAME = 'members'
  AND REFERENCED_COLUMN_NAME = 'id';
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  'memberships' AS tabella,
  COUNT(DISTINCT member_id) AS records_con_riferimenti
FROM memberships
WHERE member_id IN (
  SELECT id FROM members WHERE fiscal_code IN (
    SELECT fiscal_code FROM members
    WHERE fiscal_code IS NOT NULL AND fiscal_code != ''
    AND active=1
    GROUP BY fiscal_code HAVING COUNT(*)>1
  )
)
UNION ALL
SELECT 'payments', COUNT(DISTINCT member_id)
FROM payments
WHERE member_id IN (
  SELECT id FROM members WHERE fiscal_code IN (
    SELECT fiscal_code FROM members
    WHERE fiscal_code IS NOT NULL AND fiscal_code != ''
    AND active=1
    GROUP BY fiscal_code HAVING COUNT(*)>1
  )
);
\""
