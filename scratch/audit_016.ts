import fs from "fs";
const env = fs.readFileSync(".env", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    process.env.DATABASE_URL = line.split("=")[1].replace(/"/g, "").trim();
  }
}

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runAudit() {
  console.log("=== Q1: Conta Corsi totali e attivi nella stagione attiva ===");
  const q1 = await db.execute(sql`
    SELECT 
      s.name as stagione, 
      COUNT(*) as totali, 
      SUM(CASE WHEN c.active=1 THEN 1 ELSE 0 END) as attivi
    FROM courses c
    JOIN seasons s ON c.season_id = s.id
    WHERE s.active=1 AND c.activity_type='course'
    GROUP BY s.name;
  `);
  console.table(q1[0] || q1);

  console.log("\n=== Q2: Records lezione_individuale stagione attiva ===");
  const q2 = await db.execute(sql`
    SELECT id, name, sku, active, season_id, created_at, instructor_id
    FROM courses 
    WHERE activity_type='lezione_individuale'
    AND season_id IN (SELECT id FROM seasons WHERE active=1);
  `);
  console.table(q2[0] || q2);

  console.log("\n=== Q3: Enrollments per attività (TUTTE) ===");
  const q3 = await db.execute(sql`
    SELECT 
      c.activity_type, 
      COUNT(DISTINCT c.id) as schede,
      COUNT(e.id) as iscritti
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id 
      AND (e.status='active' OR e.status IS NULL)
    WHERE c.season_id IN (SELECT id FROM seasons WHERE active=1)
    AND c.activity_type IN ('course','workshop','domenica_movimento','lezione_individuale','allenamenti','campus','visita_medica')
    GROUP BY c.activity_type
    ORDER BY c.activity_type;
  `);
  console.table(q3[0] || q3);

  process.exit(0);
}

runAudit().catch(console.error);
