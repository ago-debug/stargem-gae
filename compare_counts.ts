import { db } from "./server/db";
import { courses } from "./shared/schema";

async function main() {
    const allCourses = await db.query.courses.findMany();
    
    const targetDateStr = "2026-04-22";
    const wednesdayCourses = allCourses.filter((c: any) => {
        if (!c.active) return false;
        if (c.dayOfWeek !== "MER") return false;
        
        let isWithinDates = true;
        if (c.startDate) {
            const s = new Date(c.startDate).toISOString().split('T')[0];
            if (s > targetDateStr) isWithinDates = false;
        }
        if (c.endDate) {
            const e = new Date(c.endDate).toISOString().split('T')[0];
            if (e < targetDateStr) isWithinDates = false;
        }
        return isWithinDates;
    });

    console.log(`Found ${wednesdayCourses.length} courses on Wednesday, April 22`);
    const anomalous = wednesdayCourses.filter((c: any) => !c.studioId || !c.startTime || !c.endTime);
    if (anomalous.length > 0) {
        console.log("Anomalous courses (missing time or studio):", anomalous.map((c: any) => ({ id: c.id, name: c.name, studioId: c.studioId, start: c.startTime, end: c.endTime })));
    }

    process.exit(0);
}
main().catch(console.error);
