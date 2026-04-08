import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function run() {
  const cats = await db.execute(sql`
    SELECT id, name, color FROM categories 
    WHERE color IS NOT NULL AND color != ''
    ORDER BY name`);
  console.log(JSON.stringify(cats.rows || cats[0]));
  process.exit(0);
}
run();
