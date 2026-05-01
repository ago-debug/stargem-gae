const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  const [res1] = await pool.query(`
    SELECT COUNT(*) as valid_cards 
    FROM courses 
    WHERE active = 1 
      AND day_of_week IS NOT NULL 
      AND start_time IS NOT NULL 
      AND (season_id = 1 OR season_id IS NULL)
      AND (start_date IS NULL OR start_date <= '2026-04-29')
      AND (end_date IS NULL OR end_date >= '2026-04-29')
  `);
  console.table(res1);

  process.exit(0);
}
main();
