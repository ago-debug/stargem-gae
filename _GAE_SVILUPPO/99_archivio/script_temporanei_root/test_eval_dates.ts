import { db } from "./server/db";
import { courses } from "./shared/schema";

function mapDayOfWeek(dayStr: string): number {
    const d = dayStr.toLowerCase().trim();
    if (d.includes('lun')) return 1;
    if (d.includes('mar')) return 2;
    if (d.includes('mer')) return 3;
    if (d.includes('gio')) return 4;
    if (d.includes('ven')) return 5;
    if (d.includes('sab')) return 6;
    if (d.includes('dom')) return 7;
    return 1;
}

async function main() {
    const allCourses = await db.query.courses.findMany();
    let countJuly1 = 0;
    
    // Simula `cellDate` = 1 Luglio 2026
    const cellDate = new Date(2026, 6, 1);
    const cellDayOfWeek = cellDate.getDay() === 0 ? 7 : cellDate.getDay(); 

    allCourses.forEach((c: any) => {
        if (c.active !== false && c.dayOfWeek) {
            const mappedDay = mapDayOfWeek(c.dayOfWeek);
            if (mappedDay === cellDayOfWeek) {
                let isValid = true;
                if (c.startDate) {
                    const sDate = new Date(c.startDate);
                    sDate.setHours(0, 0, 0, 0);
                    if (cellDate < sDate) isValid = false;
                }
                if (c.endDate) {
                    const eDate = new Date(c.endDate);
                    eDate.setHours(23, 59, 59, 999);
                    if (cellDate > eDate) isValid = false;
                }
                if (isValid) {
                    console.log(`Course ${c.name} (endDate: ${c.endDate}) is VALID for July 1!`);
                    countJuly1++;
                }
            }
        }
    });
    
    console.log("Count for July 1, 2026:", countJuly1);
    
    // Controlliamo che NON ci siano corsi con endDate stringa mal formata o null
    const badEnds = allCourses.filter(c => !c.endDate || new Date(c.endDate as any).getFullYear() > 2026);
    console.log("Courses without end date or extending far:", badEnds.map(c => ({id: c.id, name: c.name, end: c.endDate})));
    process.exit(0);
}
main().catch(console.error);
