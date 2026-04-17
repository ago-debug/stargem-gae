SELECT 
  employee_id,
  COUNT(*) AS tot_record,
  SUM(CASE WHEN tipo_assenza IS NULL THEN 1 ELSE 0 END) AS lavoro,
  SUM(CASE WHEN tipo_assenza='ML' THEN 1 ELSE 0 END) AS malattia,
  SUM(CASE WHEN tipo_assenza='PE' THEN 1 ELSE 0 END) AS permesso,
  SUM(CASE WHEN tipo_assenza='FE' THEN 1 ELSE 0 END) AS ferie,
  SUM(CASE WHEN tipo_assenza IN ('F','AI') THEN 1 ELSE 0 END) AS esotici,
  MIN(data) AS prima_data,
  MAX(data) AS ultima_data
FROM team_attendance_logs
GROUP BY employee_id
ORDER BY employee_id;
