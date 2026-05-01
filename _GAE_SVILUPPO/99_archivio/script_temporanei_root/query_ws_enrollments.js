import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  console.log("=== DISTRIBUTION OF WORKSHOP ENROLLMENTS ===");
  const [counts] = await connection.execute(`
    SELECT c.id, c.name, c.sku, COUNT(e.id) as enrollments_count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'workshop' AND (e.status = 'active' OR e.status IS NULL)
    GROUP BY c.id, c.name, c.sku
    ORDER BY enrollments_count DESC;
  `);
  console.log(counts);
  
  await connection.end();
}
main().catch(console.error);
