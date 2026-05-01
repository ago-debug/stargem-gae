import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const q317 = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE (season_id=1 OR season_id IS NULL) AND active=1;`);
  console.log('Total active (season=1 OR null):', q317[0][0].count); // Let's see if this is 317
  pool.end();
}

runQueries().catch(console.error);
