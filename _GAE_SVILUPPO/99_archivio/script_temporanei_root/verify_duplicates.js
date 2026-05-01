import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [duplicates] = await connection.execute(`
    SELECT member_id, course_id, COUNT(*) as cnt
    FROM enrollments
    GROUP BY member_id, course_id
    HAVING cnt > 1
  `);
  
  console.log(`Found ${duplicates.length} duplicate pairs in the fresh import.`);
  if (duplicates.length > 0) {
      console.log(`There are ${duplicates.reduce((acc, curr) => acc + (curr.cnt - 1), 0)} redundant rows to clean up.`);
  }
  
  // Clean them up right now:
  if (duplicates.length > 0) {
      console.log("Cleaning up duplicates (keeping MIN id)...");
      await connection.execute(`
          DELETE e1 FROM enrollments e1
          INNER JOIN enrollments e2 
          WHERE e1.id > e2.id 
          AND e1.member_id = e2.member_id 
          AND e1.course_id = e2.course_id
      `);
      console.log("Cleanup complete!");
  }
  
  const [totalEnrolls] = await connection.execute(`SELECT COUNT(*) as cnt FROM enrollments`);
  console.log(`Final Total enrollments: ${totalEnrolls[0].cnt}`);
  
  await connection.end();
}
main().catch(console.error);
