import 'dotenv/config';
import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function run() {
  const anagraficaQuery = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, active
    FROM members
    WHERE active = 1 AND participant_type IN ('INSEGNANTE', 'PERSONAL_TRAINER')
  `);
  
  const insegnantiQuery = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, active, staff_status
    FROM members
    WHERE (participant_type LIKE '%INSEGNANTE%' OR participant_type LIKE '%Staff%')
    AND staff_status = 'attivo'
  `);
  
  const ptQuery = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, active, staff_status
    FROM members
    WHERE (participant_type LIKE '%PT%' OR participant_type LIKE '%PERSONAL_TRAINER%')
    AND staff_status = 'attivo'
  `);

  console.log("Anagrafica INSEGNANTE+PT (active=1):", (anagraficaQuery[0] as any[]).length);
  console.log("GemStaff Insegnanti matches (staff_status=attivo):", (insegnantiQuery[0] as any[]).length);
  
  const missingInAnag = (insegnantiQuery[0] as any[]).filter(i => !(anagraficaQuery[0] as any[]).some(a => a.id === i.id));
  const missingInGemstaff = (anagraficaQuery[0] as any[]).filter(a => !(insegnantiQuery[0] as any[]).some(i => i.id === a.id));
  
  console.log("Missing in Anagrafica:", missingInAnag);
  console.log("Missing in Gemstaff:", missingInGemstaff);

  process.exit(0);
}
run();
