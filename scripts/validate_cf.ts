import 'dotenv/config';
import { db } from '../server/db';
import { members } from '../shared/schema';
import { isNotNull, eq, sql } from 'drizzle-orm';

function validateCF(cf: string): 'VALIDO' | 'INVALIDO' | 'SOSPETTO' {
  if (!cf || cf.length !== 16) return 'INVALIDO';
  const val = cf.trim().toUpperCase();
  
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(val)) {
    return 'INVALIDO';
  }
  
  const setDispari: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };
  
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = val.charAt(i);
    // position 1-indexed: i=0 is odd, i=1 is even
    if ((i + 1) % 2 !== 0) {
      sum += setDispari[c];
    } else {
      if (c >= '0' && c <= '9') {
        sum += parseInt(c, 10);
      } else {
        sum += c.charCodeAt(0) - 'A'.charCodeAt(0);
      }
    }
  }
  
  const expectedControlChar = String.fromCharCode((sum % 26) + 'A'.charCodeAt(0));
  if (expectedControlChar === val.charAt(15)) {
    return 'VALIDO';
  }
  
  return 'SOSPETTO';
}

async function run() {
  console.log("=== INIZIO VALIDAZIONE CODICE FISCALE ===");
  
  const allMembers = await db.select().from(members).where(isNotNull(members.fiscalCode));
  
  let valid = 0;
  let invalid = 0;
  let suspect = 0;
  let problematicCFs: string[] = [];

  for (const m of allMembers) {
    if (!m.fiscalCode) continue;
    if (m.participantType && ['DIPENDENTE', 'INSEGNANTE', 'PERSONAL_TRAINER'].includes(m.participantType)) {
      continue;
    }
    
    const status = validateCF(m.fiscalCode);
    
    if (status === 'VALIDO') {
      valid++;
    } else {
      if (status === 'INVALIDO') invalid++;
      if (status === 'SOSPETTO') suspect++;
      
      problematicCFs.push(m.fiscalCode);
      
      // Update notes
      const currentNotes = m.notes || '';
      if (!currentNotes.includes('[CF-INVALID]')) {
        const newNotes = currentNotes ? `${currentNotes} [CF-INVALID]` : '[CF-INVALID]';
        await db.update(members)
          .set({ notes: newNotes })
          .where(eq(members.id, m.id));
      }
    }
  }
  
  console.log("=== REPORT FINALE VALIDAZIONE ===");
  console.log(`Validi: ${valid}`);
  console.log(`Invalidi (flaggati): ${invalid}`);
  console.log(`Sospetti (flaggati): ${suspect}`);
  console.log(`Primi 20 CF problematici: ${problematicCFs.slice(0, 20).join(', ')}`);
  
  process.exit(0);
}

run().catch(e => {
  console.error("Errore generale:", e);
  process.exit(1);
});
