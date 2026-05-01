import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const courseIds = [846, 847, 848];

  console.log('--- PASSO 1A: Conferma esatta dei 3 record ---');
  const [courses] = await pool.query(`
    SELECT id, sku, name, season_id, active, start_date, end_date, instructor_id, created_at
    FROM courses
    WHERE id IN (?)
  `, [courseIds]);
  console.table(courses);

  console.log('--- PASSO 1B: Nessun record collegato ---');
  const [enrollments] = await pool.query(`SELECT COUNT(*) as count FROM enrollments WHERE course_id IN (?)`, [courseIds]);
  const [attendances] = await pool.query(`SELECT COUNT(*) as count FROM attendances WHERE course_id IN (?)`, [courseIds]);
  const [staffPresenze] = await pool.query(`SELECT COUNT(*) as count FROM staff_presenze WHERE course_id IN (?)`, [courseIds]);
  const [staffSostituzioni] = await pool.query(`SELECT COUNT(*) as count FROM staff_sostituzioni WHERE course_id IN (?)`, [courseIds]);
  
  console.log(`Enrollments: ${enrollments[0].count}`);
  console.log(`Attendances: ${attendances[0].count}`);
  console.log(`Staff Presenze: ${staffPresenze[0].count}`);
  console.log(`Staff Sostituzioni: ${staffSostituzioni[0].count}`);

  pool.end();
}

runQueries().catch(console.error);
