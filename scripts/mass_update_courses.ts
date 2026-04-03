import { db } from "../server/db";
import { courses, seasons } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Fetching active season...");
    const activeSeasons = await db.select().from(seasons).where(eq(seasons.active, true));
    if (activeSeasons.length === 0) {
        console.log("No active season found!");
        process.exit(1);
    }
    const activeSeason = activeSeasons[0];
    console.log(`Active season: ${activeSeason.name} (ID: ${activeSeason.id})`);

    const startDate = new Date('2025-09-01T00:00:00');
    const endDate = new Date('2026-06-30T00:00:00');

    console.log("Updating ALL courses...");
    const result = await db.update(courses).set({
        seasonId: activeSeason.id,
        startDate: startDate,
        endDate: endDate
    });

    console.log(`Successfully updated ${result[0].affectedRows} courses.`);
    process.exit(0);
}

main().catch(console.error);
