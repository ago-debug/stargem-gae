-- 1
SELECT COUNT(*) FROM team_shift_templates;
-- 2
SELECT settimana_tipo as settimana, giorno_settimana as giorno, COUNT(*) as n
FROM team_shift_templates
GROUP BY settimana_tipo, giorno_settimana
ORDER BY settimana_tipo, giorno_settimana
LIMIT 20;
-- 3
SELECT * FROM team_shift_templates
WHERE settimana_tipo = 'A' AND giorno_settimana = 5
LIMIT 5;
