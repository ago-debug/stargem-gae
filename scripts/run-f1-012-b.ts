import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
  });

  console.log("=== FASE B: DROP TABLE ===");
  try {
    await connection.execute(`DROP TABLE IF EXISTS instr_rates;`);
    console.log("Tabella instr_rates droppata.");
  } catch(e: any) {
    console.log("Error dropping:", e.message);
  }

  const [t] = await connection.execute(`SHOW TABLES LIKE 'instr%';`);
  console.table(t);

  await connection.end();
}

run().catch(console.error);
