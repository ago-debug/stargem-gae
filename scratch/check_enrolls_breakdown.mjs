import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const ids = [632, 641, 823, 824, 825, 826, 827];
  const [enr] = await pool.query(`SELECT course_id, COUNT(*) as count FROM enrollments WHERE course_id IN (?) GROUP BY course_id`, [ids]);
  console.table(enr);
  pool.end();
}

runQueries().catch(console.error);
