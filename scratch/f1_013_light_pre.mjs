import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  console.log("=== PRE-UPDATE AUDIT ===");
  const [courses] = await pool.query(`
    SELECT id, sku, name, activity_type, season_id, active
    FROM courses
    WHERE id IN (551, 554)
  `);
  console.log("\\n1) Corsi Trovati:");
  console.table(courses);

  const [enrolls] = await pool.query(`
    SELECT course_id, COUNT(*) as enrollments
    FROM enrollments
    WHERE course_id IN (551, 554)
    GROUP BY course_id
  `);
  console.log("\\n2) Enrollments Collegati:");
  console.table(enrolls);

  const [types] = await pool.query(`
    SELECT activity_type, COUNT(*) as cnt
    FROM courses
    WHERE activity_type = 'visita_medica'
    GROUP BY activity_type
  `);
  console.log("\\n3) Esistenza 'visita_medica':", types.length > 0 ? types : "Nessun corso con 'visita_medica' trovato.");

  pool.end();
}

runQueries().catch(console.error);
