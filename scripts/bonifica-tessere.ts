import * as dotenv from 'dotenv';
dotenv.config();

import { eq } from 'drizzle-orm';
import { db } from '../server/db';
import { members } from '../shared/schema';

async function main() {
  console.log("Inizio bonifica tessere...");
  
  const allMembers = await db.select().from(members);
  console.log(`Trovati ${allMembers.length} membri nel database.`);
  
  let updated = 0;
  
  for (const m of allMembers) {
    let newPrevious = m.previousMembershipNumber;
    let newAthenaId = m.athenaId;
    
    // Calcola prefisso stagione (es. "2025-2026" -> "2526")
    let seasonPrefix = "2526"; // Default
    if (m.season) {
      const parts = m.season.split('-');
      if (parts.length === 2) {
        seasonPrefix = parts[0].slice(-2) + parts[1].slice(-2);
      }
    }
    
    // Format: STAGIONE-XXXXXX (es: 2526-002490)
    const paddedId = m.id.toString().padStart(6, '0');
    const newFormat = `${seasonPrefix}-${paddedId}`;
    
    // Se non sono allineati, aggiorna
    if (m.cardNumber !== newFormat || m.internalId !== newFormat) {
      // Salva storico
      if (m.cardNumber && m.cardNumber !== newFormat && m.cardNumber !== m.previousMembershipNumber) {
        // Se c'era gia qualcosa in previous, appendiamolo per non perdere nulla
        newPrevious = newPrevious ? `${newPrevious}, ${m.cardNumber}` : m.cardNumber;
      }
      
      if (m.internalId && m.internalId !== newFormat && m.internalId !== m.athenaId) {
        newAthenaId = newAthenaId ? `${newAthenaId}, ${m.internalId}` : m.internalId;
      }
      
      // Update DB
      await db.update(members)
        .set({
          cardNumber: newFormat,
          internalId: newFormat,
          previousMembershipNumber: newPrevious,
          athenaId: newAthenaId
        })
        .where(eq(members.id, m.id));
      
      updated++;
      if (updated % 100 === 0) {
        console.log(`Aggiornati ${updated} membri...`);
      }
    }
  }
  
  console.log(`Bonifica completata! Aggiornati ${updated} membri in totale.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Errore durante la bonifica:", err);
  process.exit(1);
});
