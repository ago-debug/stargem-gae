import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("=== B) INSERT custom_lists ===");
    await connection.query(`
      INSERT INTO custom_lists 
        (name, system_name, system_code, description)
      VALUES 
        ('Stato Corso', 'stato_corso', 'stato_corso', 'Stati visibili al pubblico per i corsi'),
        ('Tag Interni Corso', 'tag_interni', 'tag_interni', 'Tag interni per la segreteria - non visibili al pubblico');
    `);

    console.log("=== C) Recupera gli ID ===");
    const [lists] = await connection.query(`
      SELECT id, name, system_code FROM custom_lists
      WHERE system_code IN ('stato_corso', 'tag_interni');
    `);
    console.table(lists);

    console.log("=== D) INSERT voci stato_corso ===");
    await connection.query(`
      INSERT INTO custom_list_items (list_id, value, color, sort_order, active)
      SELECT id, 'APERTO', '#22c55e', 1, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'CHIUDERE', '#94a3b8', 2, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'COMPLETO', '#ef4444', 3, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'CON SELEZIONE', '#64748b', 4, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'IN PROG.', '#f59e0b', 5, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'ISCRIVITI', '#3b82f6', 6, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'NUOVO', '#a855f7', 7, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'PAGATO', '#10b981', 8, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'POSTO DONNA', '#ec4899', 9, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'POSTO UOMO', '#6366f1', 10, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'PRIVATO', '#78716c', 11, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'SPINGERE', '#f97316', 12, 1 FROM custom_lists WHERE system_code='stato_corso'
      UNION ALL SELECT id, 'ULTIMI POSTI', '#eab308', 13, 1 FROM custom_lists WHERE system_code='stato_corso';
    `);

    console.log("=== E) INSERT voci tag_interni ===");
    await connection.query(`
      INSERT INTO custom_list_items (list_id, value, color, sort_order, active)
      SELECT id, 'SPINGERE', '#4f46e5', 1, 1 FROM custom_lists WHERE system_code='tag_interni'
      UNION ALL SELECT id, 'CHIUDERE', '#6366f1', 2, 1 FROM custom_lists WHERE system_code='tag_interni'
      UNION ALL SELECT id, 'CON SELEZIONE', '#8b5cf6', 3, 1 FROM custom_lists WHERE system_code='tag_interni'
      UNION ALL SELECT id, 'PAGATO', '#7c3aed', 4, 1 FROM custom_lists WHERE system_code='tag_interni'
      UNION ALL SELECT id, 'PRIVATO', '#6d28d9', 5, 1 FROM custom_lists WHERE system_code='tag_interni'
      UNION ALL SELECT id, 'ULTIMI POSTI', '#5b21b6', 6, 1 FROM custom_lists WHERE system_code='tag_interni';
    `);

    console.log("=== F) Verifica finale ===");
    const [finalCheck] = await connection.query(`
      SELECT cl.system_code, cli.value, cli.color, cli.sort_order
      FROM custom_list_items cli
      JOIN custom_lists cl ON cl.id = cli.list_id
      WHERE cl.system_code IN ('stato_corso','tag_interni')
      ORDER BY cl.system_code, cli.sort_order;
    `);
    console.table(finalCheck);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("Error:", err);
  } finally {
    connection.release();
    await pool.end();
  }
}

run();
