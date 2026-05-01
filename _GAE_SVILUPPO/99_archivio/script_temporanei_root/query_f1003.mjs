import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    uri: 'mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2'
  });

  const querySafe = async (q, params=[]) => {
    try {
      const [rows] = await connection.query(q, params);
      return rows;
    } catch(e) {
      return [{error: e.message}];
    }
  };

  console.log("=== A) VERIFICA VUOTE ===");
  console.log("activities:", await querySafe(`SELECT COUNT(*) as c FROM activities`));
  console.log("universal_enrollments:", await querySafe(`SELECT COUNT(*) as c FROM universal_enrollments`));

  console.log("\n=== C) VERIFICA 16 RECORD ===");
  console.log("corsi in italiano:", await querySafe(`SELECT id, sku, name, activity_type FROM courses WHERE activity_type='corso'`));

  console.log("\n=== D) CONFERMA STRUTTURA ALTER ===");
  console.log("updated_at column:", await querySafe(`SHOW COLUMNS FROM enrollments LIKE 'updated_at'`));
  console.log("describe enrollments limit 5:", await querySafe(`DESCRIBE enrollments LIMIT 5`));

  await connection.end();
}
run().catch(console.error);
