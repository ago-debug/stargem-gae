import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const [anomalia1] = await pool.query(`
    SELECT id, sku, name, activity_type, season_id, active 
    FROM courses
    WHERE season_id IS NULL AND activity_type = 'course'
  `);
  console.log(`Total course records with season_id IS NULL: ${anomalia1.length}`);
  console.table(anomalia1);
  pool.end();
}

runQueries().catch(console.error);
