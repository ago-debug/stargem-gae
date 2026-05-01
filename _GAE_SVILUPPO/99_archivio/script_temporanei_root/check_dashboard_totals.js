import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  console.log("=== ENROLLMENTS BY SEASON ===");
  const [seasons] = await connection.execute(`
    SELECT season_id, COUNT(*) as count 
    FROM enrollments 
    GROUP BY season_id
  `);
  console.log(seasons);

  console.log("\n=== ENROLLMENTS BY ACTIVITY TYPE (Season 1) ===");
  const [activities] = await connection.execute(`
    SELECT c.activity_type, COUNT(e.id) as count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.season_id = 1
    GROUP BY c.activity_type
    ORDER BY count DESC
  `);
  console.log(activities);

  console.log("\n=== PAYMENTS BY TYPE ===");
  const [payments] = await connection.execute(`
    SELECT type, COUNT(*) as count, SUM(amount) as total
    FROM payments
    GROUP BY type
  `);
  console.log(payments);

  await connection.end();
}
main().catch(console.error);
