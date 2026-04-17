#!/bin/bash
ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
DELETE FROM members
WHERE fiscal_code = 'TSTGEN00A01H501Z';
SELECT ROW_COUNT() AS eliminati;
SELECT COUNT(*) AS totale_members_dopo FROM members;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  first_name, last_name, date_of_birth,
  COUNT(*) AS quanti,
  GROUP_CONCAT(id ORDER BY id SEPARATOR ',') AS ids,
  GROUP_CONCAT(
    COALESCE(fiscal_code,'NO-CF')
    ORDER BY id SEPARATOR ' | '
  ) AS cfs
FROM members
WHERE active = 1
GROUP BY first_name, last_name, date_of_birth
HAVING COUNT(*) > 1
ORDER BY quanti DESC
LIMIT 20;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT COUNT(*) AS gia_disattivati_cf_duplicato
FROM members m1
WHERE active = 0
AND EXISTS (
  SELECT 1 FROM members m2
  WHERE m2.fiscal_code = m1.fiscal_code
  AND m2.id != m1.id
  AND m1.fiscal_code IS NOT NULL
);
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  first_name, last_name, email,
  COUNT(*) AS quanti,
  GROUP_CONCAT(id ORDER BY id SEPARATOR ',') AS ids
FROM members
WHERE active = 1
AND email IS NOT NULL AND email != ''
GROUP BY first_name, last_name, email
HAVING COUNT(*) > 1
ORDER BY quanti DESC
LIMIT 20;
\""
