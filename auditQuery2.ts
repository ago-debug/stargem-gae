import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== A. Tutti gli users esistenti ===");
    const resA = await db.execute(sql`SELECT id, username, email, role, first_name, last_name FROM users ORDER BY role, last_name;`);
    console.log(resA[0]);

    console.log("\n=== B. Ricerca precisa dei 12 dipendenti per COGNOME in members ===");
    const resB = await db.execute(sql`
      SELECT id, first_name, last_name, email, participant_type, user_id 
      FROM members 
      WHERE last_name IN (
        'Maldonado','Fumagalli','Segura','Moustafa',
        'Villon','Bonilla','Zoila','Jasir',
        'Capogreco','Massi','Santo','Pasini'
      )
      OR (first_name = 'Alexandra' AND last_name LIKE '%Maldo%')
      OR (first_name = 'Giuditta')
      OR (first_name = 'Estefany')
      OR (first_name = 'Nura')
      OR (first_name = 'Joel')
      OR (first_name = 'Kevin' AND participant_type IS NULL)
      OR (first_name = 'Sara' AND last_name = 'Capogreco')
      OR (first_name = 'Massi')
      OR (first_name = 'Santo')
      ORDER BY first_name;
    `);
    console.log(resB[0]);

  } catch (err) {
    console.error("Error executing queries:", err);
  }
  process.exit(0);
}

run();
