const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [seasons] = await connection.execute("SELECT id, name FROM seasons WHERE active = 1");
  const seasonId = seasons.length > 0 ? seasons[0].id : 1;

  // Insert Allenamento
  await connection.execute(`
    INSERT INTO courses (name, start_date, end_date, start_time, end_time, season_id, active, activity_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, ["Test Allenamento QA", "2026-04-08", "2026-06-30", "10:00:00", "11:00:00", seasonId, 1, "allenamenti"]);
  
  // Insert Lezione Individuale
  await connection.execute(`
    INSERT INTO courses (name, start_date, end_date, start_time, end_time, season_id, active, activity_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, ["Test Lezione QA", "2026-04-08", "2026-06-30", "10:00:00", "11:00:00", seasonId, 1, "prenotazioni"]);

  const [allenamenti] = await connection.execute("SELECT COUNT(*) as c FROM courses WHERE activity_type = 'allenamenti'");
  const [lezioni] = await connection.execute("SELECT COUNT(*) as c FROM courses WHERE activity_type = 'prenotazioni'");

  console.log("Allenamenti Total:", allenamenti[0].c);
  console.log("Lezioni Total:", lezioni[0].c);

  process.exit(0);
}
main().catch(console.error);
