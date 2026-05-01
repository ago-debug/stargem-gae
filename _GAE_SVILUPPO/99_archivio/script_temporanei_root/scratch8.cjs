const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  const [res1] = await pool.query(`
    SELECT activity_type, COUNT(*) as card_count 
    FROM courses 
    WHERE active = 1 
      AND day_of_week IS NOT NULL 
    GROUP BY activity_type;
  `);
  console.log("Activity Type Breakdown:");
  console.table(res1);

  process.exit(0);
}
main();
