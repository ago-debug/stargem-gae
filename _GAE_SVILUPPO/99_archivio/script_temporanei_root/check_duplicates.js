import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [duplicates] = await connection.execute(`
    SELECT member_id, course_id, COUNT(*) as cnt
    FROM enrollments
    WHERE status = 'active' OR status IS NULL
    GROUP BY member_id, course_id
    HAVING cnt > 1
  `);
  
  console.log(`Found ${duplicates.length} duplicate enrollments (same member, same course).`);
  
  if (duplicates.length > 0) {
     console.log("Top 5 duplicates:");
     console.log(duplicates.slice(0, 5));
  }
  
  await connection.end();
}
main().catch(console.error);
