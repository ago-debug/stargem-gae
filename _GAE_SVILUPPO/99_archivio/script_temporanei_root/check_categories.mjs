import { db, pool } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const [courseCategories] = await pool.query('SELECT DISTINCT category_id FROM courses WHERE category_id IS NOT NULL');
  console.log("Category IDs in courses:", courseCategories.map(r => r.category_id));

  const [listCategories] = await pool.query(`
    SELECT i.id, i.value 
    FROM custom_list_items i 
    JOIN custom_lists l ON i.list_id = l.id 
    WHERE l.name = 'categorie'
  `);
  console.log("IDs in custom_list_items (categorie):", listCategories.map(r => r.id));

  process.exit(0);
}
run();
