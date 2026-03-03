import "dotenv/config";
import mysql from "mysql2/promise";
async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const conn = await mysql.createConnection(url);
  try {
    const [courses] = await conn.query("SELECT id, name, category_id FROM courses LIMIT 5");
    console.log("Courses:", courses);

    const [campus] = await conn.query("SELECT id, name FROM campus_activities LIMIT 5");
    console.log("Campus:", campus);

    const [enrollments] = await conn.query("SELECT id, course_id FROM enrollments LIMIT 5");
    console.log("Enrollments:", enrollments);
  } catch (e: any) { console.error(e.message); }
  await conn.end();
}
run();
