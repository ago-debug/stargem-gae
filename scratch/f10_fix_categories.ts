import { db } from "../server/db";
import { courses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Fixing category IDs in courses table...");
    
    // 408 -> 1 (Danza)
    await db.update(courses).set({ categoryId: 1 }).where(eq(courses.categoryId, 408));
    // 406 -> 2 (Ballo)
    await db.update(courses).set({ categoryId: 2 }).where(eq(courses.categoryId, 406));
    // 409 -> 3 (Aerial)
    await db.update(courses).set({ categoryId: 3 }).where(eq(courses.categoryId, 409));
    // 407 -> 4 (Fitness)
    await db.update(courses).set({ categoryId: 4 }).where(eq(courses.categoryId, 407));
    // 410 -> 5 (Bambini)
    await db.update(courses).set({ categoryId: 5 }).where(eq(courses.categoryId, 410));

    console.log("Done fixing category IDs!");
    process.exit(0);
}

main();
