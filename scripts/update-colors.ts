import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const updateRes = await db.execute(sql`
      UPDATE custom_list_items cli
      INNER JOIN categories cat ON cat.name = cli.value
      SET cli.color = cat.color
      WHERE cli.list_id = 23
      AND cat.color IS NOT NULL
      AND cat.color != '';
    `);
    
    const count = (updateRes as any)?.[0]?.affectedRows || 0;
    console.log(`Updated rows: ${count}`);
    
    const selectRes = await db.execute(sql`
      SELECT value, color FROM custom_list_items
      WHERE list_id = 23
      ORDER BY value;
    `);
    console.log("Colors:");
    console.log(JSON.stringify((selectRes as any)?.[0] || selectRes, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
