import { pool } from "./server/db";
import * as fs from "fs";

async function run() {
  const sql = fs.readFileSync("migrations/0016_windy_killraven.sql", "utf8");
  const statements = sql.split(";").filter(s => s.trim() !== "");
  for (const statement of statements) {
    console.log("Executing:", statement.trim());
    await pool.query(statement.trim());
  }
  console.log("Done.");
  process.exit(0);
}
run().catch(console.error);
