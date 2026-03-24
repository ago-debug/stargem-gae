import "dotenv/config";
import mysql from "mysql2/promise";
async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL!);
  const [enrollments] = await db.query("SELECT * FROM enrollments ORDER BY id DESC LIMIT 5");
  const [payments] = await db.query("SELECT * FROM payments ORDER BY id DESC LIMIT 5");
  console.log("Last Enrollments:", enrollments);
  console.log("Last Payments:", payments);
  process.exit(0);
}
main();
