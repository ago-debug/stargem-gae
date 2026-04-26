import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("=== E1. Drop Legacy Tables ===");
    await connection.query(`SET FOREIGN_KEY_CHECKS=0;`);
    await connection.query(`DROP TABLE IF EXISTS participant_types;`);
    await connection.query(`DROP TABLE IF EXISTS payment_methods;`);
    await connection.query(`SET FOREIGN_KEY_CHECKS=1;`);
    console.log("Tables participant_types and payment_methods dropped.");

    console.log("=== E2. Verify Drop ===");
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema='stargem_v2'
      AND table_name IN ('participant_types','payment_methods');
    `);
    console.log("Remaining tables (should be 0):", (tables as any[]).length);

    console.log("\n=== F1. Rename Stato to Stato Iscrizione ===");
    const [updateRes] = await connection.query(`
      UPDATE custom_lists 
      SET name = 'Stato Iscrizione',
          system_name = 'stato_iscrizione',
          system_code = 'stato_iscrizione'
      WHERE system_code = 'stato'
         OR name = 'Stato';
    `);
    console.log("Rows updated:", (updateRes as any).affectedRows);

    console.log("\n=== F2. Verify Rename ===");
    const [verifica] = await connection.query(`
      SELECT id, name, system_code FROM custom_lists
      WHERE system_code IN ('stato_iscrizione','stato_corso','tag_interni');
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
