import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const result = await db.execute(sql`DELETE FROM team_scheduled_shifts WHERE ora_inizio = ora_fine`);
    console.log("Deleted 0-duration shifts:", result);
  } catch (err: any) {
    console.log("ERR:", err);
  }
  process.exit(0);
}
run();
