import 'dotenv/config';
import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function run() {
  const anagraficaQuery = await db.execute(sql`
    SELECT id, first_name, last_name, participant_type, active, staff_status
    FROM members
    WHERE active = 1 AND participant_type = 'DIPENDENTE'
  `);
  
  console.log("Anagrafica team matches:", (anagraficaQuery[0] as any[]).length);
  
  const teamInattivo = (anagraficaQuery[0] as any[]).filter(r => r.staff_status === 'inattivo');
  console.log("Team inattivo:", teamInattivo.length);

  process.exit(0);
}
run();
