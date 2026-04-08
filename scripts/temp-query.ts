import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- TEST: Logica seasonId=active (stagione attiva) ---");
  const activeSeason = await db.execute(sql`
    SELECT id, name FROM seasons WHERE active = 1 LIMIT 1;
  `);
  console.log("Stagione attiva:", activeSeason[0]);

  const activeSeasonId = (activeSeason[0] as unknown as any[])[0]?.id;
  if (!activeSeasonId) {
    console.log("Nessuna stagione attiva trovata!");
    process.exit(0);
  }

  const corsi = await db.execute(sql`
    SELECT COUNT(*) as tot FROM courses
    WHERE activity_type = 'course'
    AND (season_id = ${activeSeasonId} OR season_id IS NULL);
  `);
  console.log("Corsi stagione attiva:", (corsi[0] as unknown as any[])[0]);

  process.exit(0);
}
main().catch(console.error);
