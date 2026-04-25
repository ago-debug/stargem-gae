const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'gaetano_admin',
      password: 'Verona2026stargem2026',
      database: 'stargem_v2'
    });

    const [rows] = await connection.execute("SELECT recurrence_type, COUNT(*) as n FROM courses WHERE season_id = 1 GROUP BY recurrence_type;");
    console.log("Q3 RESULTS:");
    console.log(rows);
    await connection.end();
  } catch(e) {
    console.error(e);
  }
}

main();
