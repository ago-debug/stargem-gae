-- A) Tutti i record courses
SELECT 'A', COUNT(*) FROM courses;

-- B) Per activity_type
SELECT 'B', activity_type, COUNT(*) FROM courses GROUP BY activity_type;

-- C) Solo activity_type = 'course'
SELECT 'C', COUNT(*) FROM courses WHERE activity_type='course';

-- D) Per season_id
SELECT 'D', season_id, COUNT(*) FROM courses GROUP BY season_id;

-- E) Solo course in stagione attiva (id=1)
SELECT 'E', COUNT(*) FROM courses WHERE activity_type='course' AND season_id=1;

-- F) Solo course attivi in stagione attiva
SELECT 'F', COUNT(*) FROM courses WHERE activity_type='course' AND season_id=1 AND active=1;

-- G) Solo course attivi con day_of_week
SELECT 'G', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND day_of_week IS NOT NULL;

-- H) Solo course attivi con day_of_week + start_time
SELECT 'H', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND day_of_week IS NOT NULL AND start_time IS NOT NULL;

-- I) Solo course attivi con day_of_week + start_time + end_time
SELECT 'I', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND day_of_week IS NOT NULL 
  AND start_time IS NOT NULL AND end_time IS NOT NULL;

-- J) Solo course attivi con TUTTI i campi base + categoria
SELECT 'J', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND day_of_week IS NOT NULL 
  AND start_time IS NOT NULL AND end_time IS NOT NULL
  AND category_id IS NOT NULL;

-- K) Solo course attivi con instructor
SELECT 'K', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND instructor_id IS NOT NULL;

-- L) Course con start_date / end_date validi rispetto a oggi
SELECT 'L', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND (start_date IS NULL OR start_date <= '2026-04-29')
  AND (end_date IS NULL OR end_date >= '2026-04-29');

-- M) Course nel range settimana corrente (27apr-3mag)
SELECT 'M', COUNT(*) FROM courses 
WHERE activity_type='course' AND season_id=1 AND active=1
  AND (start_date IS NULL OR start_date <= '2026-05-03')
  AND (end_date IS NULL OR end_date >= '2026-04-27');
