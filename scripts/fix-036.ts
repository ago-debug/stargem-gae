import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("--- FIX 1 (B020): DELETE test records ---");
    await db.execute(sql`DELETE FROM custom_list_items WHERE id IN (430, 431, 432, 433, 434)`);
    const r1 = await db.execute(sql`SELECT COUNT(*) as count FROM custom_list_items WHERE list_id = 27`);
    console.log("Voci rimaste list_id 27:", r1[0]);

    console.log("--- FIX 3 (B030): INSERT new custom list ---");
    const exist = await db.execute(sql`SELECT id FROM custom_lists WHERE system_name='tipologie_allenamenti'`);
    if ((exist[0] as any[]).length === 0) {
      const listRes = await db.execute(sql`
        INSERT INTO custom_lists (name, system_name, description)
        VALUES ('Tipologie Allenamenti', 'tipologie_allenamenti', 'Tipologie per le sessioni di allenamento')
      `);
      
      await db.execute(sql`INSERT INTO custom_list_items (list_id, value, sort_order) SELECT id, 'Singola', 1 FROM custom_lists WHERE system_name='tipologie_allenamenti'`);
      await db.execute(sql`INSERT INTO custom_list_items (list_id, value, sort_order) SELECT id, 'Coppia', 2 FROM custom_lists WHERE system_name='tipologie_allenamenti'`);
      await db.execute(sql`INSERT INTO custom_list_items (list_id, value, sort_order) SELECT id, 'Gruppo', 3 FROM custom_lists WHERE system_name='tipologie_allenamenti'`);
      await db.execute(sql`INSERT INTO custom_list_items (list_id, value, sort_order) SELECT id, 'Personal Trainer', 4 FROM custom_lists WHERE system_name='tipologie_allenamenti'`);
      await db.execute(sql`INSERT INTO custom_list_items (list_id, value, sort_order) SELECT id, 'Prove', 5 FROM custom_lists WHERE system_name='tipologie_allenamenti'`);
    } else {
       console.log("Tipologie Allenamenti esiste già");
    }

    const newItems = await db.execute(sql`
      SELECT id, value FROM custom_list_items 
      WHERE list_id = (SELECT id FROM custom_lists WHERE system_name='tipologie_allenamenti')
      ORDER BY sort_order ASC
    `);
    console.log("Nuovi ID generati:", newItems[0]);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
