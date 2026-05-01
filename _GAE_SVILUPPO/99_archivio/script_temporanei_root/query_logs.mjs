import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    uri: 'mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2'
  });

  const querySafe = async (q) => {
    try {
      const [rows] = await connection.query(q);
      return rows;
    } catch(e) {
      return [{error: e.message}];
    }
  };

  console.log("=== AUDIT LOGS ===");
  console.log("Columns:", await querySafe(`SHOW COLUMNS FROM audit_logs`));
  console.log("Recent:", await querySafe(`SELECT * FROM audit_logs WHERE created_at >= '2026-04-26 00:00:00' LIMIT 5`));
  
  console.log("\n=== USER ACTIVITY LOGS ===");
  console.log("Columns:", await querySafe(`SHOW COLUMNS FROM user_activity_logs`));
  console.log("Recent:", await querySafe(`SELECT * FROM user_activity_logs WHERE created_at >= '2026-04-26 00:00:00' LIMIT 5`));

  console.log("\n=== SYSTEM LOGS ===");
  console.log("Columns:", await querySafe(`SHOW COLUMNS FROM system_logs`));
  console.log("Recent:", await querySafe(`SELECT * FROM system_logs WHERE created_at >= '2026-04-26 00:00:00' LIMIT 5`));

  await connection.end();
}
run().catch(console.error);
