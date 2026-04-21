import { db } from "./server/db";
import { courses } from "./shared/schema";
import { gt, inArray } from "drizzle-orm";

async function main() {
    console.log("Fixing rounded dates...");
    await db.update(courses)
        .set({ endDate: new Date("2026-06-30T12:00:00.000Z") })
        .where(inArray(courses.id, [431, 441, 442, 448, 474, 476, 477, 479, 480, 483, 508, 509, 510]));
    console.log("Fixed dates to 30 June 12:00 PM for the 13 courses.");
    process.exit(0);
}
main().catch(console.error);
