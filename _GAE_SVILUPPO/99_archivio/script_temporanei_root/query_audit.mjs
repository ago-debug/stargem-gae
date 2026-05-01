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

  console.log("=== ENROLLMENTS ===");
  console.log("Total:", await querySafe(`SELECT COUNT(*) as c FROM enrollments`));
  console.log("Created >= 25:", await querySafe(`SELECT COUNT(*) as c FROM enrollments WHERE created_at >= '2026-04-25 00:00:00'`));
  console.log("By source_file >= 25:", await querySafe(`SELECT source_file, COUNT(*) as c FROM enrollments WHERE created_at >= '2026-04-25 00:00:00' GROUP BY source_file`));
  console.log("Timeline >= 25:", await querySafe(`SELECT DATE(created_at) as d, HOUR(created_at) as h, COUNT(*) as c FROM enrollments WHERE created_at >= '2026-04-25 00:00:00' GROUP BY DATE(created_at), HOUR(created_at)`));

  console.log("\n=== MEMBERS ===");
  console.log("Total:", await querySafe(`SELECT COUNT(*) as c FROM members`));
  console.log("Created >= 25:", await querySafe(`SELECT COUNT(*) as c FROM members WHERE created_at >= '2026-04-25 00:00:00'`));
  console.log("By from_where >= 25:", await querySafe(`SELECT from_where, COUNT(*) as c FROM members WHERE created_at >= '2026-04-25 00:00:00' GROUP BY from_where`));
  console.log("Timeline >= 25:", await querySafe(`SELECT DATE(created_at) as d, HOUR(created_at) as h, COUNT(*) as c FROM members WHERE created_at >= '2026-04-25 00:00:00' GROUP BY DATE(created_at), HOUR(created_at)`));

  console.log("\n=== PAYMENTS ===");
  console.log("Total:", await querySafe(`SELECT COUNT(*) as c FROM payments`));
  console.log("Created >= 25:", await querySafe(`SELECT COUNT(*) as c FROM payments WHERE created_at >= '2026-04-25 00:00:00'`));
  console.log("By source >= 25:", await querySafe(`SELECT source, COUNT(*) as c FROM payments WHERE created_at >= '2026-04-25 00:00:00' GROUP BY source`));
  console.log("By receipt_number (count non null) >= 25:", await querySafe(`SELECT COUNT(receipt_number) as c FROM payments WHERE created_at >= '2026-04-25 00:00:00' AND receipt_number IS NOT NULL`));
  console.log("Timeline >= 25:", await querySafe(`SELECT DATE(created_at) as d, HOUR(created_at) as h, COUNT(*) as c FROM payments WHERE created_at >= '2026-04-25 00:00:00' GROUP BY DATE(created_at), HOUR(created_at)`));

  console.log("\n=== COURSES ===");
  console.log("Total:", await querySafe(`SELECT COUNT(*) as c FROM courses`));
  console.log("Created >= 25:", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE created_at >= '2026-04-25 00:00:00'`));
  console.log("By type >= 25:", await querySafe(`SELECT activity_type, COUNT(*) as c FROM courses WHERE created_at >= '2026-04-25 00:00:00' GROUP BY activity_type`));
  console.log("Timeline >= 25:", await querySafe(`SELECT DATE(created_at) as d, HOUR(created_at) as h, COUNT(*) as c FROM courses WHERE created_at >= '2026-04-25 00:00:00' GROUP BY DATE(created_at), HOUR(created_at)`));

  console.log("\n=== LOGS ===");
  console.log("audit_logs:", await querySafe(`SELECT action, target_table, DATE(created_at) as d, COUNT(*) as c FROM audit_logs WHERE created_at >= '2026-04-25 00:00:00' AND target_table IN ('enrollments', 'members', 'payments', 'courses') GROUP BY action, target_table, d`));
  console.log("user_activity_logs:", await querySafe(`SELECT action, target_resource, DATE(created_at) as d, COUNT(*) as c FROM user_activity_logs WHERE created_at >= '2026-04-25 00:00:00' GROUP BY action, target_resource, d`));

  await connection.end();
}
run().catch(console.error);
