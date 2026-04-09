import { db, connection } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  const tables = [
    "ws_attendances", "ws_cats", "rec_cats", "sun_cats", 
    "vac_cats", "ca_cats", "workshops", "free_trials", 
    "paid_trials", "single_lessons", "campus_activities", 
    "vacation_studies", "courses"
  ];
  
  for (const table of tables) {
    try {
      const [{ count }] = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
      console.log(`Table ${table} count: ${count}`);
    } catch (e: any) {
      console.log(`Table ${table} error: ${e.message}`);
    }
  }

  process.exit(0);
}
main().catch(console.error);
