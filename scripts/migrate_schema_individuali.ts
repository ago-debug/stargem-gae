import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Adding columns to courses...");
  try {
    await db.execute(sql`ALTER TABLE \`courses\` ADD \`lesson_type\` json DEFAULT ('[]');`);
  } catch(e) { console.log(e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE \`courses\` ADD \`number_of_people\` varchar(50);`);
  } catch(e) { console.log(e.message); }

  console.log("Done");
  process.exit(0);
}

run();
