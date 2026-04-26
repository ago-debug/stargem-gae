import 'dotenv/config';
import { pool } from '../server/db';
import { eq } from 'drizzle-orm';
import { customLists, customListItems } from '../shared/schema';

async function run() {
  const [listRow] = await pool.query('SELECT id FROM custom_lists WHERE system_code = "stato_iscrizione" LIMIT 1;');
  if (!listRow || listRow.length === 0) {
    console.log("List stato_iscrizione not found!");
    process.exit(1);
  }
  const listId = listRow[0].id;
  
  const seed = [
    { value: "CONFERMATA", color: "#22c55e" },
    { value: "IN ATTESA", color: "#eab308" },
    { value: "PROVA", color: "#3b82f6" },
    { value: "LISTA ATTESA", color: "#f97316" },
    { value: "ANNULLATA", color: "#ef4444" },
    { value: "SOSPESA", color: "#8b5cf6" },
    { value: "COMPLETATA", color: "#64748b" }
  ];

  await pool.query(`DELETE FROM custom_list_items WHERE list_id = ?`, [listId]);

  let order = 1;
  for (const s of seed) {
    await pool.query(`INSERT INTO custom_list_items (list_id, value, color, sort_order, active) VALUES (?, ?, ?, ?, ?)`, [listId, s.value, s.color, order, 1]);
    order++;
  }
  
  console.log("Seed stato_iscrizione completato.");
  process.exit(0);
}
run();
