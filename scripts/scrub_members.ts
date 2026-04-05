import "dotenv/config";
import { db } from "../server/db";
import { members } from "../shared/schema";
import { like, or } from "drizzle-orm";

async function scrubMembers() {
  console.log("Inizio scrubbing anagrafiche di test...");

  // Trova tutti i membri con email o nomi "test", "pippo", ecc.
  const badMembers = await db.query.members.findMany({
    where: or(
      like(members.firstName, "%test%"),
      like(members.lastName, "%test%"),
      like(members.firstName, "%pippo%"),
      like(members.email, "%test%"),
      like(members.email, "%pippo%")
    )
  });

  console.log(`Trovate ${badMembers.length} anagrafiche problematiche.`);

  for (let i = 0; i < badMembers.length; i++) {
    const member = badMembers[i];
    
    // Nomi realistici
    const firstNames = ["Marco", "Giulia", "Alessandro", "Martina", "Luca", "Francesca", "Matteo", "Sara", "Andrea", "Chiara"];
    const lastNames = ["Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca"];
    
    const newFirst = firstNames[i % firstNames.length];
    const newLast = lastNames[i % lastNames.length];
    const newEmail = `${newFirst.toLowerCase()}.${newLast.toLowerCase()}${i}@example.com`;

    await db.update(members)
      .set({
        firstName: newFirst,
        lastName: newLast,
        email: newEmail,
      })
      .where(or(
          like(members.id, member.id)
      ));
      
    console.log(`[Scrubbed] ${member.id}: ${member.firstName} -> ${newFirst} ${newLast} (${newEmail})`);
  }

  console.log("Scrubbing completato correntemente!");
}

scrubMembers().catch(console.error);
