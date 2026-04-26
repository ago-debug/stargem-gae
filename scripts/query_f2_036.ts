import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { pool } from '../server/db';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("=== Verifica custom_list_items per 'stato_corso' ===");
    const [listRows] = await connection.query(`
      SELECT id FROM custom_lists WHERE system_code = 'stato_corso' LIMIT 1;
    `);
    
    if ((listRows as any).length > 0) {
      const listId = (listRows as any)[0].id;
      
      const [items] = await connection.query(`
        SELECT id, value, active FROM custom_list_items WHERE list_id = ?
      `, [listId]);
      
      console.log("Items attuali nello stato corso:");
      console.table(items);

      // Elimina ATTIVO e CHIUDERE se esistono
      const [deleteRes] = await connection.query(`
        DELETE FROM custom_list_items 
        WHERE list_id = ? AND value IN ('ATTIVO', 'CHIUDERE')
      `, [listId]);
      console.log("Voci eliminate dal pennino:", (deleteRes as any).affectedRows);
    } else {
      console.log("Lista stato_corso non trovata.");
    }

    console.log("\n=== Pulizia parole orfane dai corsi ===");
    // Trova tutti i corsi che hanno 'STATE:ATTIVO' o 'STATE:CHIUDERE' nel JSON
    const [courses] = await connection.query(`
      SELECT id, name, status_tags FROM courses 
      WHERE JSON_CONTAINS(status_tags, '"STATE:ATTIVO"') 
         OR JSON_CONTAINS(status_tags, '"STATE:CHIUDERE"');
    `);
    
    console.log(`Corsi trovati con tag orfani: ${(courses as any).length}`);
    
    let updatedCount = 0;
    for (const course of (courses as any)) {
      let tags = course.status_tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [];
        }
      }
      if (Array.isArray(tags)) {
        const newTags = tags.filter(t => t !== 'STATE:ATTIVO' && t !== 'STATE:CHIUDERE');
        await connection.query(`
          UPDATE courses SET status_tags = ? WHERE id = ?
        `, [JSON.stringify(newTags), course.id]);
        updatedCount++;
      }
    }
    
    console.log(`Corsi aggiornati: ${updatedCount}`);

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
