const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [seasons] = await connection.execute("SELECT id, name FROM seasons WHERE active = 1");
  const seasonId = seasons.length > 0 ? seasons[0].id : 1;

  const insertCourseList = async (name, type) => {
    await connection.execute(`
      INSERT INTO courses (name, start_date, end_date, start_time, end_time, season_id, active, activity_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, "2026-04-08", "2026-06-30", "10:00:00", "11:00:00", seasonId, 1, type]);
    
    const [c] = await connection.execute("SELECT COUNT(*) as c FROM courses WHERE activity_type = ?", [type]);
    console.log(`[OK] Inserted ${name} as ${type}. Total for type: ${c[0].c}`);
  };

  await insertCourseList("Test QA Domeniche", "sunday_activities");
  await insertCourseList("Test QA Saggi", "recitals");
  await insertCourseList("Test QA Vacanze", "vacation_studies");
  await insertCourseList("Test QA Corsi Normale", "course");

  process.exit(0);
}
main().catch(console.error);
