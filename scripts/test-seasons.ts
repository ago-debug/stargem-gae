import "dotenv/config";
import mysql from "mysql2/promise";
async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL!);
  const [seasons] = await db.query("SELECT id, name FROM seasons");
  const [pl] = await db.query("SELECT id, name FROM price_lists");
  console.log("Seasons:", seasons);
  console.log("Price Lists:", pl);
  process.exit(0);
}
main();
