import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res7 = await db.execute(sql`ALTER TABLE enrollments ADD COLUMN gsheet_chi_scrive VARCHAR(255)`);
    console.log("res7", res7);
    const res8 = await db.execute(sql`ALTER TABLE enrollments ADD COLUMN gsheet_vendita VARCHAR(255)`);
    console.log("res8", res8);
  } catch (e: any) {
    console.log(e);
  }
  process.exit(0);
}
main();
