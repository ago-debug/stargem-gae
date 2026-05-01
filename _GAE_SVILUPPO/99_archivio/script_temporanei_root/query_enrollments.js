import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  console.log("=== ENROLLMENTS BY ACTIVITY TYPE ===");
  const [totalCounts] = await connection.execute(`
    SELECT
      c.activity_type,
      COUNT(e.id) as enrollments_count
    FROM enrollments e
    LEFT JOIN courses c ON e.course_id = c.id
    WHERE e.status = 'active' OR e.status IS NULL
    GROUP BY c.activity_type
    ORDER BY enrollments_count DESC;
  `);
  console.log(totalCounts);

  console.log("=== WORKSHOP ENROLLMENTS ===");
  const [workshopCounts] = await connection.execute(`
    SELECT COUNT(*) as count FROM workshop_enrollments WHERE status = 'active' OR status IS NULL;
  `);
  console.log(workshopCounts);

  console.log("=== CAMPUS ENROLLMENTS ===");
  const [campusCounts] = await connection.execute(`
    SELECT COUNT(*) as count FROM campus_enrollments WHERE status = 'active' OR status IS NULL;
  `);
  console.log(campusCounts);

  console.log("=== ORPHAN ENROLLMENTS (NO COURSE) ===");
  const [orphanCounts] = await connection.execute(`
    SELECT COUNT(*) as orphan_count 
    FROM enrollments e 
    LEFT JOIN courses c ON e.course_id = c.id 
    WHERE c.id IS NULL AND (e.status = 'active' OR e.status IS NULL);
  `);
  console.log(orphanCounts);

  await connection.end();
}
main().catch(console.error);
