const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const db = drizzle(pool);
  
  const [res1] = await pool.query('SELECT activity_type, COUNT(*) as total, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active FROM courses GROUP BY activity_type');
  console.log("activities-summary (no season filter):");
  console.table(res1);

  const [res2] = await pool.query('SELECT season_id, COUNT(*) as total, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active FROM courses GROUP BY season_id');
  console.log("\ncourses by season:");
  console.table(res2);

  const [res3] = await pool.query('SELECT COUNT(*) as total FROM courses WHERE active=1 AND day_of_week IS NOT NULL AND start_time IS NOT NULL');
  console.log("\ncourses active with day and time:");
  console.table(res3);

  const [res4] = await pool.query('SELECT COUNT(*) as active_enrollments FROM enrollments WHERE status = "active" OR status IS NULL');
  console.log("\nactive enrollments total:");
  console.table(res4);

  const [res5] = await pool.query('SELECT activity_type, COUNT(*) as active_enrollments FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE (e.status = "active" OR e.status IS NULL) AND c.active = 1 GROUP BY activity_type');
  console.log("\nactive enrollments by active courses/workshops:");
  console.table(res5);

  const [res6] = await pool.query('SELECT COUNT(*) as active_enrollments FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE (e.status = "active" OR e.status IS NULL) AND c.activity_type="workshop"');
  console.log("\nactive enrollments for ALL workshops (including historical):");
  console.table(res6);
  
  process.exit(0);
}
main();
