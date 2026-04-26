import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("=== INSERT Stato Iscrizione ===");
    const [insertRes] = await connection.query(`
      INSERT INTO custom_lists 
        (name, system_name, system_code, description)
      VALUES (
        'Stato Iscrizione',
        'stato_iscrizione', 
        'stato_iscrizione',
        'Stato di una iscrizione (attivo, sospeso, cancellato...)'
      );
    `);
    console.log("Rows affected:", (insertRes as any).affectedRows);

    console.log("\n=== Verifica ===");
    const [verifica] = await connection.query(`
      SELECT id, name, system_code FROM custom_lists
      WHERE system_code = 'stato_iscrizione';
    `);
    console.table(verifica);

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
