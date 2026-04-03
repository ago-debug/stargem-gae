const { db } = require('./server/db');
const { seasons } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function fix() {
  const allSeasons = await db.query.seasons.findMany();
  console.log("Current seasons:", allSeasons);
  for (const s of allSeasons) {
    if (s.name.includes("2026/2027")) {
      console.log("Fixing season", s.name);
      await db.update(seasons).set({ active: false }).where(eq(seasons.id, s.id));
    }
  }
  console.log("Done");
  process.exit(0);
}
fix().catch(err => { console.error(err); process.exit(1); });
