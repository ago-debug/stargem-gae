import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const q333 = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND active=1;`);
  console.log('Total course AND active=1 (all seasons):', q333[0][0].count); // Should be 313

  const qNull = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id IS NULL;`);
  console.log('Total course AND season_id=NULL:', qNull[0][0].count); // Let's see if 307 + qNull = 314? Wait, 307 + 7 = 314.

  pool.end();
}

runQueries().catch(console.error);
