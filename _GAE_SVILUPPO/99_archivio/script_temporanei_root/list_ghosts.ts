import { db } from "./server/db";

async function main() {
    console.log("Searching for phantom courses (missing studioId, startTime, or endTime)...");
    
    const allCourses = await db.query.courses.findMany();
    const ghosts = allCourses.filter(c => c.active && (!c.studioId || !c.startTime || !c.endTime));
    
    console.log(`Found ${ghosts.length} active phantom courses:`);
    ghosts.forEach(g => {
        console.log(`- ID: ${g.id} | Name: ${g.name} | Giorno: ${g.dayOfWeek} | Studio: ${g.studioId} | Ore: ${g.startTime}-${g.endTime}`);
    });
    process.exit(0);
}
main().catch(console.error);
