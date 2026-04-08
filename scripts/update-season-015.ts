import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Esecuzione UPDATE season_id...");
  const res = await db.execute(sql`
    UPDATE courses 
    SET season_id = 1
    WHERE activity_type IN ('allenamenti', 'prenotazioni')
    AND season_id != 1;
  `);
  console.log(res[0] || res);
  process.exit(0);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
setTimeout(() => process.exit(0), 5000);
