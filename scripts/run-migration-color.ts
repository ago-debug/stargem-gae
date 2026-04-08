import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  await db.execute(sql`ALTER TABLE custom_list_items ADD COLUMN color varchar(7) DEFAULT NULL;`);
  console.log("✅ Colonna color aggiunta!");
  process.exit(0);
}

run().catch(console.error);
