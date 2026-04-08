import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("--- TEST 1: UPDATE and SELECT ---");
    // Find an 'allenamenti' course
    const allenamento = await db.execute(sql`SELECT id FROM courses WHERE activity_type = 'allenamenti' LIMIT 1`);
    if (!(allenamento[0] as any[]).length) {
      console.log("Nessun allenamento trovato");
    } else {
      const id = (allenamento[0] as any[])[0].id;
      // Update it
      await db.execute(sql`
        UPDATE courses SET 
          lesson_type = JSON_ARRAY('Singola'),
          status_tags = JSON_ARRAY('PAGATO')
        WHERE id = ${id}
      `);
      
      // Select it back
      const res = await db.execute(sql`
        SELECT id, lesson_type, status_tags 
        FROM courses 
        WHERE id = ${id}
      `);
      console.log("Risultato TEST 1:", res[0]);
    }

    console.log("--- TEST 2: SELECT recents ---");
    const recents = await db.execute(sql`
      SELECT id, name, instructor_id, lesson_type, status_tags
      FROM courses 
      WHERE activity_type IN ('allenamenti','prenotazioni')
      ORDER BY created_at DESC LIMIT 3
    `);
    console.log("Risultato TEST 2:", recents[0]);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
