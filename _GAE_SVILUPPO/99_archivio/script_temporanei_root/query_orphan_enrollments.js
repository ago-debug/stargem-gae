import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  console.log("=== ORPHAN ENROLLMENTS (NO COURSE ID OR NON-EXISTENT COURSE) ===");
  const [orphanCounts] = await connection.execute(`
    SELECT COUNT(*) as orphan_count 
    FROM enrollments e 
    LEFT JOIN courses c ON e.course_id = c.id 
    WHERE c.id IS NULL AND (e.status = 'active' OR e.status IS NULL);
  `);
  console.log(orphanCounts);

  const [orphanSamples] = await connection.execute(`
    SELECT e.id, e.course_id, e.member_id, e.status, e.details
    FROM enrollments e 
    LEFT JOIN courses c ON e.course_id = c.id 
    WHERE c.id IS NULL AND (e.status = 'active' OR e.status IS NULL)
    LIMIT 5;
  `);
  console.log(orphanSamples);
  
  await connection.end();
}
main().catch(console.error);
