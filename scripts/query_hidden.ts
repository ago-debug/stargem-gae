import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  console.log("=== DB CHECK ===");
  const [stato] = await pool.query('SELECT cl.system_code, COUNT(cli.id) as total_items FROM custom_lists cl JOIN custom_list_items cli ON cli.list_id = cl.id WHERE cl.system_code = "stato_corso" GROUP BY cl.system_code;');
  console.log("Stato Corso items:", stato);
  
  const [interni] = await pool.query('SELECT cl.system_code, COUNT(cli.id) as total_items FROM custom_lists cl JOIN custom_list_items cli ON cli.list_id = cl.id WHERE cl.system_code = "tag_interni" GROUP BY cl.system_code;');
  console.log("Tag Interni items:", interni);
  
  const [categorie] = await pool.query('SELECT cl.system_code, COUNT(cli.id) as total_items FROM custom_lists cl JOIN custom_list_items cli ON cli.list_id = cl.id WHERE cl.system_code = "categorie" GROUP BY cl.system_code;');
  console.log("Categorie (custom_lists) items:", categorie);
  
  try {
    const [categoriesTable] = await pool.query('SELECT COUNT(*) as total_items FROM categories;');
    console.log("Categories (categories table) items:", categoriesTable);
  } catch (e) {
    console.log("Categories table does not exist or error:", e.message);
  }

  process.exit(0);
}
run();
