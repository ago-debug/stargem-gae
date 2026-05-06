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
  `);
  
  const ptQuery = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, active, staff_status
    FROM members
    WHERE (participant_type LIKE '%PT%' OR participant_type LIKE '%PERSONAL_TRAINER%')
  `);

  console.log("Anagrafica counts-by-type matches:", (anagraficaQuery[0] as any[]).length);
  console.log("GemStaff Insegnanti matches (ALL):", (insegnantiQuery[0] as any[]).length);
  console.log("GemStaff PT matches (ALL):", (ptQuery[0] as any[]).length);
  
  const insegnantiAttivi = (insegnantiQuery[0] as any[]).filter(r => r.staff_status !== 'INATTIVO').length;
  console.log("GemStaff Insegnanti matches (attivo):", insegnantiAttivi);

  process.exit(0);
}
run();
