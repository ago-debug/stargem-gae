import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- ANALISI 1: Iscrizioni per stagione e tipo ---");
  const res1 = await db.execute(sql`
    SELECT 
      e.season_id,
      s.name as stagione,
      c.activity_type,
      COUNT(*) as n
    FROM enrollments e
    LEFT JOIN seasons s ON e.season_id = s.id
    LEFT JOIN courses c ON e.course_id = c.id
    GROUP BY e.season_id, s.name, c.activity_type
    ORDER BY e.season_id, c.activity_type;
  `);
  console.table(res1[0] || res1);

  console.log("\n--- ANALISI 2: Le 929 iscrizioni orfane (season_id NULL) ---");
  const res2 = await db.execute(sql`
    SELECT 
      c.season_id as season_corso,
      s.name as nome_stagione,
      c.activity_type,
      c.sku,
      COUNT(*) as n_iscrizioni
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN seasons s ON c.season_id = s.id
    WHERE e.season_id IS NULL
    GROUP BY c.season_id, s.name, c.activity_type, c.sku
    ORDER BY n_iscrizioni DESC
    LIMIT 20;
  `);
  console.table(res2[0] || res2);

  console.log("\n--- ANALISI 3: Le 6371 iscrizioni 'storico' ---");
  const res3 = await db.execute(sql`
    SELECT 
      c.sku,
      c.name,
      c.season_id,
      s.name as stagione_corso,
      COUNT(*) as n_iscritti
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN seasons s ON c.season_id = s.id
    WHERE c.activity_type = 'storico'
      AND e.season_id = 1
    GROUP BY c.sku, c.name, c.season_id, s.name
    ORDER BY n_iscritti DESC
    LIMIT 15;
  `);
  console.table(res3[0] || res3);

  console.log("\n--- ANALISI 4: I corsi 'storico' quando sono stati creati? ---");
  const res4 = await db.execute(sql`
    SELECT 
      activity_type,
      season_id,
      MIN(sku) as primo_sku,
      MAX(sku) as ultimo_sku,
      COUNT(*) as n_corsi
    FROM courses
    GROUP BY activity_type, season_id
    ORDER BY season_id, activity_type;
  `);
  console.table(res4[0] || res4);

  process.exit(0);
}
run().catch(console.error);
