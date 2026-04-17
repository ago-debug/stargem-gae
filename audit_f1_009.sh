#!/bin/bash
ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT
  m.id, m.first_name, m.last_name, ms.id AS membership_id, ms.membership_number, ms.membership_type
FROM members m
JOIN memberships ms ON ms.member_id = m.id
WHERE m.fiscal_code IS NULL AND m.email IS NULL AND m.phone IS NULL AND m.mobile IS NULL AND m.date_of_birth IS NULL AND m.active = 1;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT loser.id AS loser_id, loser.first_name, loser.last_name, winner.id AS winner_id
FROM members loser
JOIN (
  SELECT first_name, last_name, MIN(id) AS id
  FROM members
  WHERE fiscal_code IS NULL AND email IS NULL AND phone IS NULL AND mobile IS NULL AND date_of_birth IS NULL AND active = 1
  GROUP BY first_name, last_name
  HAVING COUNT(*) > 1
) winner ON winner.first_name = loser.first_name AND winner.last_name = loser.last_name AND winner.id != loser.id
JOIN memberships ms ON ms.member_id = loser.id
WHERE loser.fiscal_code IS NULL AND loser.email IS NULL AND loser.phone IS NULL AND loser.mobile IS NULL AND loser.date_of_birth IS NULL AND loser.active = 1;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
START TRANSACTION;

UPDATE memberships ms
JOIN (
  SELECT
    loser.id AS loser_id,
    winner.min_id AS winner_id
  FROM members loser
  JOIN (
    SELECT first_name, last_name, MIN(id) AS min_id
    FROM members
    WHERE fiscal_code IS NULL AND email IS NULL AND phone IS NULL AND mobile IS NULL AND date_of_birth IS NULL AND active = 1
    GROUP BY first_name, last_name
    HAVING COUNT(*) > 1
  ) winner ON winner.first_name = loser.first_name AND winner.last_name = loser.last_name AND winner.min_id != loser.id
  JOIN memberships m2 ON m2.member_id = loser.id
  WHERE loser.fiscal_code IS NULL AND loser.email IS NULL AND loser.phone IS NULL AND loser.mobile IS NULL AND loser.date_of_birth IS NULL AND loser.active = 1
) migration ON ms.member_id = migration.loser_id
SET ms.member_id = migration.winner_id;

SELECT ROW_COUNT() AS memberships_migrate;

DELETE FROM members
WHERE fiscal_code IS NULL AND email IS NULL AND phone IS NULL AND mobile IS NULL AND date_of_birth IS NULL AND active = 1
  AND id NOT IN (
    SELECT min_id FROM (
      SELECT MIN(id) AS min_id
      FROM members
      WHERE fiscal_code IS NULL AND email IS NULL AND phone IS NULL AND mobile IS NULL AND date_of_birth IS NULL AND active = 1
      GROUP BY first_name, last_name
      HAVING COUNT(*) > 1
    ) AS keepers
  )
  AND (first_name, last_name) IN (
    SELECT fn, ln FROM (
      SELECT first_name AS fn, last_name AS ln
      FROM members
      WHERE fiscal_code IS NULL AND email IS NULL AND phone IS NULL AND mobile IS NULL AND date_of_birth IS NULL AND active = 1
      GROUP BY first_name, last_name
      HAVING COUNT(*) > 1
    ) AS dupes
  );

SELECT ROW_COUNT() AS gusci_eliminati;
SELECT COUNT(*) AS totale_members_finale FROM members;

COMMIT;
\""

ssh root@82.165.35.145 "mariadb -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 -e \"
SELECT COUNT(*) AS gusci_residui
FROM (
  SELECT first_name, last_name
  FROM members
  WHERE fiscal_code IS NULL AND email IS NULL AND phone IS NULL AND mobile IS NULL AND date_of_birth IS NULL AND active = 1
  GROUP BY first_name, last_name
  HAVING COUNT(*) > 1
) x;
\""

ssh root@82.165.35.145 "mysqldump -u gaetano_admin -p'Verona2026stargem2026' stargem_v2 > /root/backups/DEFINITIVO_post_dedup_completo_\$(date +%Y%m%d_%H%M).sql && echo 'BACKUP OK' && ls -lh /root/backups/DEFINITIVO_post_dedup_completo_*.sql | tail -1"
