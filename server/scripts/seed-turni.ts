import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../shared/schema";

const POSTAZIONI = ["RECEPTION", "PRIMO", "SECONDO", "UFFICIO", "AMM.ZIONE", "WORKSHOP"];

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
  });
  const db = drizzle(connection, { schema, mode: "default" });

  console.log("Inizio operazione di seeding turni storici (GemTeam)...");

  try {
    const dipendenti = await db.select().from(schema.teamEmployees);
    if (dipendenti.length === 0) {
      console.log("Nessun dipendente trovato. Creare almeno un dipendente prima di lanciare il seed.");
      process.exit(0);
    }

    let insertCount = 0;
    
    // Generiamo turni per le ultime 4 settimane
    const now = new Date();
    
    for (let i = 1; i <= 28; i++) {
      // Data target
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      
      // Evitiamo la domenica se vogliamo (opzionale, ma mettiamoli casuali)
      if (targetDate.getDay() === 0) continue;

      // Scegliamo 2-3 dipendenti a caso per ogni giorno
      const dipendentiDelGiorno = [...dipendenti].sort(() => 0.5 - Math.random()).slice(0, 3);
      
      for (const dip of dipendentiDelGiorno) {
        // Genera orario randomico, es: 09:00 - 13:00 oppure 14:00 - 18:00
        const isMattina = Math.random() > 0.5;
        const oraInizio = isMattina ? "09:00:00" : "14:00:00";
        const oraFine = isMattina ? "13:00:00" : "18:00:00";
        const postazione = POSTAZIONI[Math.floor(Math.random() * POSTAZIONI.length)] as any;

        try {
          await db.insert(schema.teamScheduledShifts).values({
            employeeId: dip.id,
            data: targetDate,
            oraInizio,
            oraFine,
            postazione,
            createdByUserId: 'admin-id'
          });
          insertCount++;
        } catch (e) {
          // ignore duplicate
        }
        
        // Limite a 50 turni
        if (insertCount >= 50) break;
      }
      
      if (insertCount >= 50) break;
    }

    console.log(`✅ Seeding completato. Inseriti ${insertCount} turni storici nel database.`);
  } catch (err) {
    console.error("❌ Errore durante il seeding:", err);
  } finally {
    await connection.end();
  }
}

main();
