import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function r(query: string) {
    try {
        console.log(`\n=== QUERY: ${query.substring(0, 80).replace(/\n/g, ' ')}... === `);
        const [result] = await db.execute(sql.raw(query));
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
}

async function run() {
    console.log("=== A) Elimina record 'Test' ===");
    await r(`DELETE FROM strategic_events WHERE LOWER(title) = 'test'`);

    console.log("=== B) Mostra duplicati ===");
    await r(`
      SELECT n.id, n.title, n.start_date, n.season_id as "NULL_SID", e.id as id_con_stagione, e.season_id
      FROM strategic_events n
      JOIN strategic_events e 
        ON n.title = e.title AND n.start_date = e.start_date
      WHERE n.season_id IS NULL AND e.season_id IS NOT NULL
    `);

    console.log("=== C) Elimina duplicati esatti NULL ===");
    await r(`
      DELETE FROM strategic_events
      WHERE season_id IS NULL
        AND (title, start_date) IN (
          SELECT title, start_date 
          FROM (SELECT title, start_date FROM strategic_events WHERE season_id IS NOT NULL) as sub
        )
    `);

    console.log("=== D) Assegna season_id ===");
    // Actually the logic provided by user assigns season_id correctly:
    await r(`
      UPDATE strategic_events
      SET season_id = CASE
        WHEN start_date BETWEEN '2025-09-01' AND '2026-08-31' THEN 1
        WHEN start_date BETWEEN '2026-09-01' AND '2027-08-31' THEN 2
        ELSE NULL
      END
      WHERE season_id IS NULL
    `);

    console.log("=== E) Verifica finale ===");
    await r(`SELECT season_id, COUNT(*) as n FROM strategic_events GROUP BY season_id ORDER BY season_id`);
    await r(`SELECT id, title, start_date, season_id, event_type, color FROM strategic_events ORDER BY season_id, start_date`);

    const result = await db.execute(sql.raw(`SELECT COUNT(*) as c FROM strategic_events`));
    console.log("\\nTOTAL STRATEGIC EVENTS:", (result[0] as any)[0].c);

    process.exit(0);
}
run();
