import mysql from 'mysql2/promise';

async function audit() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'stargem_gae',
    password: 'stargem_gae',
    database: 'stargem_gae'
  });
  
  const [rows] = await conn.execute(`
    SELECT activity_type, season_id, active, COUNT(*) as count 
    FROM courses 
    GROUP BY activity_type, season_id, active
    ORDER BY activity_type, season_id
  `);
  
  console.table(rows);
  conn.end();
}

audit();
