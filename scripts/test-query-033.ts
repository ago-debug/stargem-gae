import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`
    SELECT c.id, c.name, cli.value, cli.list_id
    FROM courses c
    LEFT JOIN custom_list_items cli 
      ON cli.id = c.category_id
    WHERE c.activity_type = 'allenamenti'
    LIMIT 5;
  `);
  console.log(JSON.stringify(result[0], null, 2));
  process.exit(0);
}
run();
