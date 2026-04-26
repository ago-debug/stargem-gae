import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
import { execSync } from 'child_process';

async function run() {
  console.log("--- STEP 1a: grep server/routes.ts ---");
  try {
    const out1a = execSync('grep -n "6230\\|iscrizioni_attive\\|totalEnrollments\\|enrollments.*count\\|count.*enrollments" server/routes.ts | head -20').toString();
    console.log(out1a || "Nessun risultato");
  } catch(e) { console.log("Nessun risultato o errore"); }

  console.log("\n--- STEP 1b: grep iscritti_per_attivita.tsx ---");
  try {
    const out1b = execSync('grep -n "iscrizioni\\|enrollments\\|total\\|count" client/src/pages/iscritti_per_attivita.tsx 2>/dev/null | head -30').toString();
    console.log(out1b || "Nessun risultato");
  } catch(e) { console.log("Nessun risultato o errore (forse il file non esiste)"); }

  console.log("\n--- STEP 2: Iscrizioni per activity_type (join courses) ---");
  const res2a = await db.execute(sql`
    SELECT c.activity_type, COUNT(*) as n
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.season_id = 1
    GROUP BY c.activity_type;
  `);
  console.table(res2a[0] || res2a);

  console.log("\n--- STEP 2b: Iscrizioni per participation_type (se esiste) ---");
  const res2b = await db.execute(sql`
    SELECT participation_type, COUNT(*) as n
    FROM enrollments
    WHERE season_id = 1
    GROUP BY participation_type;
  `);
  console.table(res2b[0] || res2b);

  console.log("\n--- STEP 3: Iscrizioni senza season_id ---");
  const res3a = await db.execute(sql`
    SELECT COUNT(*) as null_season FROM enrollments 
    WHERE season_id IS NULL;
  `);
  console.table(res3a[0] || res3a);

  console.log("\n--- STEP 3b: Per course_id (senza season_id) ---");
  const res3b = await db.execute(sql`
    SELECT course_id, COUNT(*) as n
    FROM enrollments
    WHERE season_id IS NULL
    GROUP BY course_id
    ORDER BY n DESC
    LIMIT 10;
  `);
  console.table(res3b[0] || res3b);

  process.exit(0);
}
run().catch(console.error);
