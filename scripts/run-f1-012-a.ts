import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
  });

  console.log("=== 1. deprecation_logs ===");
  try {
    const [q1] = await connection.execute(`
      SELECT COUNT(*) as tot, operation, table_name
        FROM deprecation_logs GROUP BY operation, table_name;
    `);
    console.table(q1);
  } catch(e) {}

  console.log("=== 2. instr_rates ===");
  try {
    const [q2] = await connection.execute(`SELECT COUNT(*) as tot FROM instr_rates;`);
    console.table(q2);
  } catch(e) {}

  console.log("=== 3. SHOW TABLES LIKE 'instructor%' ===");
  try {
    const [q3] = await connection.execute(`SHOW TABLES LIKE 'instructor%';`);
    console.table(q3);
  } catch(e) {}

  console.log("=== 4. corsi_con_istruttore ===");
  try {
    const [q4] = await connection.execute(`
      SELECT COUNT(*) as corsi_con_istruttore
        FROM courses WHERE instructor_id IS NOT NULL;
    `);
    console.table(q4);
  } catch(e) {}

  await connection.end();
}

run().catch(console.error);
