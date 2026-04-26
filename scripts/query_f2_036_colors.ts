import 'dotenv/config';
import { pool } from '../server/db';
async function run() {
  console.log("=== DB CHECK COLORS ===");
  const [stato] = await pool.query('SELECT value, color FROM custom_list_items WHERE list_id = (SELECT id FROM custom_lists WHERE system_code="stato_corso") LIMIT 5;');
  console.log("Stato Corso items:", stato);
  
  const [interni] = await pool.query('SELECT value, color FROM custom_list_items WHERE list_id = (SELECT id FROM custom_lists WHERE system_code="tag_interni") LIMIT 5;');
  console.log("Tag Interni items:", interni);
  process.exit(0);
}
run();
