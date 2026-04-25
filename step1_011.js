import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
import { execSync } from 'child_process';

async function run() {
  console.log("--- 1a. Route specifica scheda corso ---");
  try {
    const out1a = execSync('grep -n "scheda-corso\\|course-detail\\|/api/courses/:id/enrolled\\|/api/courses/:id/members" server/routes.ts | head -20').toString();
    console.log(out1a || "Nessuna corrispondenza trovata.");
  } catch (e) {
    console.log("Nessuna corrispondenza trovata.");
  }

  console.log("\n--- 1b. Come viene caricata la lista iscritti ---");
  try {
    const out1b = execSync('grep -n "/api/enrollments\\|getEnrollments\\|course.*enrolled" server/routes.ts | head -20').toString();
    console.log(out1b || "Nessuna corrispondenza trovata.");
  } catch (e) {
    console.log("Nessuna corrispondenza trovata.");
  }

  console.log("\n--- 1c. Struttura memberships ---");
  const res1c = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns
    WHERE table_schema='stargem_v2' 
      AND table_name='memberships'
      AND column_name IN ('member_id','expiry_date','membership_number','status','season_id')
    ORDER BY ordinal_position;
  `);
  console.table(res1c[0] || res1c);

  console.log("\n--- 1d. Struttura medical_certificates ---");
  const res1d = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns  
    WHERE table_schema='stargem_v2'
      AND table_name='medical_certificates'
      AND column_name IN ('member_id','expiry_date','issue_date','status')
    ORDER BY ordinal_position;
  `);
  console.table(res1d[0] || res1d);

  console.log("\n--- 1e. Record attivi ---");
  const res1e1 = await db.execute(sql`SELECT COUNT(*) as memberships_con_scadenza FROM memberships WHERE expiry_date IS NOT NULL;`);
  console.table(res1e1[0] || res1e1);

  const res1e2 = await db.execute(sql`SELECT COUNT(*) as cert_medici_con_scadenza FROM medical_certificates WHERE expiry_date IS NOT NULL;`);
  console.table(res1e2[0] || res1e2);

  process.exit(0);
}
run().catch(console.error);
