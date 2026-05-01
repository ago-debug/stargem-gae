const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  const [res1] = await pool.query('SELECT activity_type, COUNT(*) as total, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active FROM courses GROUP BY activity_type');
  console.table(res1);

  process.exit(0);
}
main();
