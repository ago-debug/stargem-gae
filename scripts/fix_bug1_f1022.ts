import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql.raw("ALTER TABLE dossier_steps MODIFY completed_by VARCHAR(255)"));
    console.log("dossier_steps.completed_by altered successfully");
    process.exit(0);
  } catch (e: any) {
    console.error("EXACT ERROR:", e);
    process.exit(1);
  }
}
run();
