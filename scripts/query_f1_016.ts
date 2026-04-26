import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("=== A. Rinomina Tag Interni Corso ===");
    const [updateRes] = await connection.query(`
      UPDATE custom_lists 
      SET name = 'Interno Corso'
      WHERE system_code = 'tag_interni';
    `);
    console.log("Rows updated:", (updateRes as any).affectedRows);

    console.log("\n=== B. Crea liste mancanti ===");
    const [insertRes] = await connection.query(`
      INSERT IGNORE INTO custom_lists 
        (name, system_name, system_code, description)
      VALUES
        ('Dettaglio Iscrizione', 'dettaglio_iscrizione', 'dettaglio_iscrizione', 'Dettagli aggiuntivi per le iscrizioni'),
        ('Note Pagamento', 'note_pagamento', 'note_pagamento', 'Note e annotazioni sui pagamenti'),
        ('Tipi Carnet', 'tipi_carnet', 'tipi_carnet', 'Tipologie di carnet e pacchetti lezioni'),
        ('Categorie Anagrafica', 'categorie_anagrafica', 'categorie_anagrafica', 'Categorie per classificare i membri'),
        ('Canale di Acquisizione', 'canale_acquisizione', 'canale_acquisizione', 'Come ci ha conosciuto il cliente'),
        ('Tessera Ente', 'tessera_ente', 'tessera_ente', 'Enti di tesseramento sportivo'),
        ('Categorie Affitti', 'categorie_affitti', 'categorie_affitti', 'Tipologie di spazi in affitto'),
        ('Categorie Booking', 'categorie_booking', 'categorie_booking', 'Categorie per le prenotazioni'),
        ('Categorie Merchandising', 'categorie_merchandising', 'categorie_merchandising', 'Categorie prodotti merchandising'),
        ('Campus', 'campus', 'campus', 'Tipologie e nomi dei campus');
    `);
    console.log("Rows affected:", (insertRes as any).affectedRows);

    console.log("\n=== C. Verifica ===");
    const [verifica] = await connection.query(`
      SELECT id, name, system_code FROM custom_lists
      ORDER BY id;
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
