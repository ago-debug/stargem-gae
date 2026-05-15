import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql.raw("ALTER TABLE dossiers MODIFY created_by VARCHAR(255)"));
    await db.execute(sql.raw("ALTER TABLE dossier_audit_log MODIFY performed_by VARCHAR(255)"));
    console.log("dossiers.created_by altered successfully");
    process.exit(0);
  } catch (e: any) {
    console.error("EXACT ERROR:", e);
    process.exit(1);
  }
}
run();
