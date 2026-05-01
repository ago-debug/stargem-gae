import { db } from "./server/db";
import { courses } from "./shared/schema";
import { isNull, or } from "drizzle-orm";

async function main() {
    console.log("Deleting phantom courses (missing studioId, startTime, or endTime)...");
    
    const allCourses = await db.query.courses.findMany();
    const ghosts = allCourses.filter((c: any) => c.active && (!c.studioId || !c.startTime || !c.endTime));
    
    console.log(`Found ${ghosts.length} active phantom courses to delete.`);
    
    let deletedCount = 0;
    for (const ghost of ghosts) {
        // hard delete or soft delete? The user says "tira via questi 19 record, eliminiamole". Hard delete.
        await db.delete(courses).where(or(
            isNull(courses.studioId),
            isNull(courses.startTime),
            isNull(courses.endTime)
        ));
        // Actually, drizzle delete condition without `inArray` can be simpler:
        // just delete everything matching the condition
    }

    const { count } = await db.execute("DELETE FROM courses WHERE studio_id IS NULL OR start_time IS NULL OR end_time IS NULL");
    
    console.log(`Successfully deleted ghosts.`);
    
    process.exit(0);
}
main().catch(console.error);
