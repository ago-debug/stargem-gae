import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("=== Prima verifica ===");
    const [prima] = await connection.query(`
      SELECT id, name, system_name, system_code
      FROM custom_lists
      WHERE name LIKE '%posti%' OR system_name LIKE '%posti%';
    `);
    console.table(prima);

    console.log("\n=== Update system_code ===");
    const [updateRes] = await connection.query(`
      UPDATE custom_lists
      SET system_code = 'posti_disponibili'
      WHERE system_name = 'posti_disponibili' OR name LIKE '%Posti%';
    `);
    console.log("Rows affected:", (updateRes as any).affectedRows);

    console.log("\n=== Seconda verifica ===");
    const [dopo] = await connection.query(`
      SELECT id, name, system_name, system_code
      FROM custom_lists
      WHERE name LIKE '%posti%' OR system_name LIKE '%posti%';
    `);
    console.table(dopo);

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
