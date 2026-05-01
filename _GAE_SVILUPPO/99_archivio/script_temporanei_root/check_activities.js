import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const [res] = await connection.execute(`
    SELECT c.activity_type, count(e.id) as enrollments_count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    GROUP BY c.activity_type
  `);
  
  console.log("Distribution of enrollments by activity_type:");
  console.log(res);

  await connection.end();
}
main().catch(console.error);
