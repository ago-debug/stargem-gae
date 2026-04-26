import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
import { execSync } from 'child_process';

async function run() {
  console.log("--- 3. Iscrizioni della stagione attiva ---");
  const res3 = await db.execute(sql`
    SELECT COUNT(*) as iscrizioni_stagione_attiva
    FROM enrollments e
    JOIN seasons s ON e.season_id = s.id
    WHERE s.active = 1;
  `);
  console.table(res3[0] || res3);

  console.log("\n--- 4. Come viene calcolato nel frontend (grep) ---");
  try {
    const out = execSync('grep -n "6230\\|iscrizioni\\|enrollments\\|COUNT\\|count" server/routes.ts | grep -i "attiv\\|active\\|season" | head -20').toString();
    console.log(out || "Nessun risultato");
  } catch (err) {
    console.log("Nessun risultato o errore grep.");
  }

  process.exit(0);
}
run().catch(console.error);
