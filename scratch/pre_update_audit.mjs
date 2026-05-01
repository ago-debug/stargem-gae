import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  // ANOMALIA 1
  const [anomalia1] = await pool.query(`
    SELECT id, sku, name, season_id, active, start_date, end_date, instructor_id, created_at
    FROM courses
    WHERE season_id IS NULL AND active = 1
  `);
  console.log(`ANOMALIA 1 (season_id IS NULL AND active=1): ${anomalia1.length} record`);
  console.table(anomalia1);
  if (anomalia1.length > 0) {
    const ids = anomalia1.map(r => r.id);
    const [enr] = await pool.query(`SELECT COUNT(*) as count FROM enrollments WHERE course_id IN (?)`, [ids]);
    console.log(`Enrollments collegati: ${enr[0].count}`);
  }

  // ANOMALIA 2
  const [anomalia2] = await pool.query(`
    SELECT season_id, COUNT(*) as count
    FROM courses
    WHERE active = 1 AND activity_type = 'course'
    GROUP BY season_id
  `);
  console.log('\\nCorsi attivi raggruppati per season_id:');
  console.table(anomalia2);

  const [allSeasons] = await pool.query(`SELECT id, name FROM seasons`);
  console.log('\\nStagioni disponibili:');
  console.table(allSeasons);

  pool.end();
}

runQueries().catch(console.error);
