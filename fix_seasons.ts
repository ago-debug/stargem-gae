import { db } from './server/db.js';
import { seasons } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function fix() {
  const allSeasons = await db.select().from(seasons);
  console.log("Current seasons:", allSeasons);
  for (const s of allSeasons) {
    if (s.name.includes("2026/2027") && s.active) {
      console.log("Fixing season", s.name);
      await db.update(seasons).set({ active: false }).where(eq(seasons.id, s.id));
    }
  }
  console.log("Done");
  process.exit(0);
}
fix().catch(err => { console.error(err); process.exit(1); });
