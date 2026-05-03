import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../server/db';
import { memberships, members } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  console.log("Inizio sincronizzazione memberships.membership_number con members.card_number...");
  
  const allMembers = await db.select().from(members);
  let updated = 0;
  let skipped = 0;

  for (const m of allMembers) {
    if (!m.cardNumber) continue;

    // Get active memberships for this member
    const activeMemberships = await db.select().from(memberships).where(
      and(
        eq(memberships.memberId, m.id),
        eq(memberships.status, 'active')
      )
    );

    for (let i = 0; i < activeMemberships.length; i++) {
      const ms = activeMemberships[i];
      // Only the first one gets the exact card_number, others get a suffix if there are duplicates
      const targetNumber = i === 0 ? m.cardNumber : `${m.cardNumber}-${i}`;
      
      if (ms.membershipNumber !== targetNumber) {
        try {
          await db.update(memberships)
            .set({ membershipNumber: targetNumber })
            .where(eq(memberships.id, ms.id));
          updated++;
        } catch (e: any) {
          console.error(`Errore su member ${m.id} (ms id ${ms.id}):`, e.message);
          skipped++;
        }
      }
    }
  }
  
  console.log(`Sincronizzazione completata! Aggiornati: ${updated}, Skippati: ${skipped}`);
  process.exit(0);
}

main();
