import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const [act] = await db.execute(sql`SHOW CREATE TABLE activities_unified;`);
    console.log("=== ACTIVITIES UNIFIED ===");
    console.log(act[0]['Create Table']);
    
    const [enr] = await db.execute(sql`SHOW CREATE TABLE enrollments_unified;`);
    console.log("=== ENROLLMENTS UNIFIED ===");
    console.log(enr[0]['Create Table']);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
