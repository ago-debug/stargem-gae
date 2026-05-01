import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const [courses] = await pool.query(`SELECT id, name, sku, active FROM courses WHERE activity_type = 'lezione_individuale'`);
  console.table(courses);
  pool.end();
}

runQueries().catch(console.error);
