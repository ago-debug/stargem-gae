import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.execute("SELECT * FROM todos ORDER BY id DESC LIMIT 5");
  console.log("Recent todos:", rows);
  await conn.end();
}
main();
