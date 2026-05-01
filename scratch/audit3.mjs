import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const qAll = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id=1 OR season_id IS NULL;`);
  console.log('Total course (season=1 OR null):', qAll[0][0].count); // Should be 585
  pool.end();
}

runQueries().catch(console.error);
