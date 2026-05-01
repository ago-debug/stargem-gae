const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  const [res1] = await pool.query(`
    SELECT COUNT(*) as in_hours 
    FROM courses 
    WHERE active = 1 
      AND day_of_week IS NOT NULL 
      AND start_time IS NOT NULL 
      AND (season_id = 1 OR season_id IS NULL)
      AND start_time >= '07:00:00' 
      AND start_time < '23:00:00'
  `);
  console.table(res1);

  process.exit(0);
}
main();
