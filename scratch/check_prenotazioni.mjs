import mysql from 'mysql2/promise';

async function runCheck() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });
  
  const [rows] = await conn.execute(`
    SELECT 
      c.id, 
      c.name, 
      c.sku, 
      c.season_id, 
      c.active, 
      c.created_at,
      COUNT(e.id) as iscritti_attivi
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id 
      AND (e.status='active' OR e.status IS NULL)
    WHERE c.activity_type='prenotazioni'
    GROUP BY c.id, c.name, c.sku, c.season_id, c.active, c.created_at;
  `);
  
  console.table(rows);
  conn.end();
}

runCheck().catch(console.error);
