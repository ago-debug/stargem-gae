import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql.raw("ALTER TABLE members CHANGE attachment_metadata attachments_url JSON"));
    console.log("attachments_url renamed successfully");
    process.exit(0);
  } catch (e: any) {
    console.error("EXACT ERROR:", e);
    process.exit(1);
  }
}
run();
