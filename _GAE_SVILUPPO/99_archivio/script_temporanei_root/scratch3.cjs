const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  const [res1] = await pool.query('SELECT activity_type, COUNT(*) as card_count FROM courses WHERE active = 1 AND day_of_week IS NOT NULL AND start_time IS NOT NULL AND (season_id = 1 OR season_id IS NULL) GROUP BY activity_type');
  console.log("Card breakdown by activity_type in active season:");
  console.table(res1);

  const [res2] = await pool.query('SELECT COUNT(*) as total_cards FROM courses WHERE active = 1 AND day_of_week IS NOT NULL AND start_time IS NOT NULL AND (season_id = 1 OR season_id IS NULL)');
  console.log("\nTotal cards:");
  console.table(res2);

  process.exit(0);
}
main();
