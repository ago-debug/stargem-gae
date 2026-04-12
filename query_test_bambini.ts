import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const res = await db.execute(sql`
      SELECT id, name, category_id 
      FROM courses 
      WHERE season_id = 1
      AND category_id IN (
        SELECT id FROM custom_list_items 
        WHERE value = 'Bambini'
      )
      LIMIT 5;
    `);
    console.log("RISULTATI DB BAMBINI:", JSON.stringify(res, null, 2));

    const allCategories = await db.execute(sql`
      SELECT id, value, list_id FROM custom_list_items WHERE value LIKE '%Bambini%'
    `);
    console.log("Categorie list items:", JSON.stringify(allCategories, null, 2));

    const countAll = await db.execute(sql`
      SELECT COUNT(*) as totale FROM courses WHERE season_id = 1
    `);
    console.log("Totale corsi:", JSON.stringify(countAll, null, 2));

  } catch (err) {
    console.error("DB QUERY ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
