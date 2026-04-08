import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runUpdate() {
  console.log("🚀 Inizio UPDATE Activity Type (Protocollo 013)...");

  try {
    const result = await db.execute(sql`
      UPDATE courses 
      SET activity_type = 
        CASE 
          WHEN lesson_type LIKE '%Singola%' THEN 'prenotazioni'
          WHEN lesson_type LIKE '%Private%' THEN 'prenotazioni'
          WHEN lesson_type LIKE '%Cardio%' THEN 'allenamenti'
          WHEN lesson_type LIKE '%Pesistica%' THEN 'allenamenti'
          ELSE 'course'
        END
      WHERE activity_type IS NULL;
    `);
    
    console.log("✅ UPDATE Eseguito con successo!");
    console.log(result[0] || result);
  } catch (error) {
    console.error("❌ Errore durante l'UPDATE:", error);
    process.exit(1);
  }

  process.exit(0);
}

runUpdate().catch(console.error);
