import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const [totals] = await pool.query(`
    SELECT season_id, active, COUNT(*) as count 
    FROM courses 
    WHERE activity_type = 'course' 
    GROUP BY season_id, active
  `);
  console.table(totals);
  pool.end();
}

runQueries().catch(console.error);
