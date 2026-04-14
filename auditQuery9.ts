import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("=== STEP 1 & 5 DB AUDIT ===");

  const t = await db.execute(sql`
    SELECT TABLE_NAME, TABLE_ROWS
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'stargem_v2'
    AND TABLE_NAME LIKE 'team_%'
    ORDER BY TABLE_NAME;
  `);
  console.log("TABLES:\n", t[0]);

  const dip = await db.execute(sql`SELECT COUNT(*) as dipendenti FROM team_employees WHERE attivo = 1;`);
  console.log("\nDIPENDENTI ATTIVI:\n", dip[0]);

  const pres = await db.execute(sql`SELECT COUNT(*) as presenze FROM team_attendance_logs;`);
  console.log("\nPRESENZE TOTALI:\n", pres[0]);

  const act = await db.execute(sql`SELECT COUNT(*) as activity_types FROM team_activity_types;`);
  console.log("\nACTIVITY TYPES:\n", act[0]);

  const p = await db.execute(sql`
    SELECT te.id, m.first_name, m.last_name, 
           te.team, te.tariffa_oraria,
           te.member_id, te.user_id
    FROM team_employees te
    JOIN members m ON m.id = te.member_id
    ORDER BY te.team, m.last_name;
  `);
  console.log("\nDIPENDENTI E DETTAGLI:\n", p[0]);

  const hs = await db.execute(sql`
    SELECT 
      MONTH(data) as mese,
      YEAR(data) as anno,
      COUNT(*) as righe
    FROM team_attendance_logs
    GROUP BY anno, mese
    ORDER BY anno, mese;
  `);
  console.log("\nSTORICO PRESENZE PER MESE (STEP 5):\n", hs[0]);

  process.exit(0);
}

run();
