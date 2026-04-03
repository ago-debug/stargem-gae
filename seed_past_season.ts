import { db } from './server/db.js';
import { seasons } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
  const allSeasons = await db.select().from(seasons);
  if (!allSeasons.some(s => s.name.includes('2024/2025'))) {
    console.log("Seeding 2024/2025 past season...");
    await db.insert(seasons).values({
      name: "Stagione 2024/2025",
      description: "Stagione storica 24-25",
      startDate: new Date("2024-09-01T00:00:00Z"),
      endDate: new Date("2025-08-31T23:59:59Z"),
      active: false
    });
    console.log("Seeded past season!");
  } else {
    console.log("Past season already exists.");
  }
  process.exit(0);
}

seed().catch(console.error);
