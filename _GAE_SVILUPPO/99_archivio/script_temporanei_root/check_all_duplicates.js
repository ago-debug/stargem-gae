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
  
  console.log(`Found ${duplicates.length} total duplicate member-course pairs in enrollments.`);
  
  const [totalEnrolls] = await connection.execute(`SELECT COUNT(*) as cnt FROM enrollments`);
  console.log(`Total enrollments: ${totalEnrolls[0].cnt}`);
  
  await connection.end();
}
main().catch(console.error);
