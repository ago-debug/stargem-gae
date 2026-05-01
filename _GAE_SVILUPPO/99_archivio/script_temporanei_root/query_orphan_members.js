import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  console.log("=== ENROLLMENTS WITHOUT VALID MEMBER ===");
  const [orphanMemberCounts] = await connection.execute(`
    SELECT COUNT(*) as orphan_count 
    FROM enrollments e 
    LEFT JOIN members m ON e.member_id = m.id 
    WHERE m.id IS NULL AND (e.status = 'active' OR e.status IS NULL);
  `);
  console.log(orphanMemberCounts);
  
  await connection.end();
}
main().catch(console.error);
