import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  console.log('--- DOMANDA 3 & 4 ---');
  const [duplicates] = await pool.query(`
    SELECT id, sku, name, season_id, active, start_date, end_date, created_at, category_id, instructor_id
    FROM courses 
    WHERE (sku IS NULL OR sku = '-' OR sku LIKE '%XXXXXXXX%')
      AND season_id = 2 
      AND created_at > '2026-04-27'
  `);
  console.table(duplicates);

  pool.end();
}

runQueries().catch(console.error);
