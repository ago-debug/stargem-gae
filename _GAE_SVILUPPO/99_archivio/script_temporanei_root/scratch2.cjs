const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  const [res1] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as active FROM courses WHERE activity_type="course" AND (season_id=1 OR season_id IS NULL)');
  console.log("courses with activity_type=course in active season (id=1 or null):");
  console.table(res1);

  const [res2] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as active FROM courses WHERE activity_type="course" AND season_id=1');
  console.log("courses with activity_type=course in active season (id=1 ONLY):");
  console.table(res2);

  process.exit(0);
}
main();
