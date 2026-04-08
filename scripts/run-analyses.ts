import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("--- B027/029: Cerca courses ---");
  const c = await db.execute(sql`
    SELECT id, lesson_type, status_tags, activity_type 
    FROM courses 
    WHERE activity_type='allenamenti' 
    LIMIT 3;
  `);
  console.log(JSON.stringify(c[0], null, 2));

  console.log("--- B020: Cerca custom_list_items obsoleto ---");
  const cli = await db.execute(sql`
    SELECT id, value, list_id FROM custom_list_items
    WHERE value LIKE '%test%' 
    AND list_id IN (
      SELECT id FROM custom_lists 
      WHERE system_name LIKE '%allenament%'
    );
  `);
  console.log(JSON.stringify(cli[0], null, 2));
  process.exit(0);
}
run();
