-- a
SELECT COUNT(*), DATE(created_at) cr, DATE(updated_at) upd
FROM team_attendance_logs
WHERE DATE(created_at) = '2026-04-13'
AND DATE(updated_at) = '2026-04-13'
GROUP BY cr, upd;

-- b
SELECT tipo_assenza, COUNT(*) n
FROM team_attendance_logs
WHERE tipo_assenza IN ('F','AI')
GROUP BY tipo_assenza;

-- c
SELECT COUNT(*) FROM team_attendance_logs
WHERE tipo_assenza IN ('F','AI')
AND DATE(created_at) = '2026-04-13'
AND DATE(updated_at) = '2026-04-13';
