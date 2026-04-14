import "dotenv/config";
import { db } from "./server/db";
import { teamCheckinEvents, teamAttendanceLogs } from "./shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

async function run() {
  try {
    const empId = 1;
    const tipo = "OUT";
    const timestampNow = new Date();

    let oreCalcolate: number | null = null;
    const d = new Date(timestampNow);
    d.setHours(12, 0, 0, 0); // avoid tz shifts
    const dataStr = d.toISOString().split('T')[0];

    const startOfDay = new Date(timestampNow);
    startOfDay.setHours(0,0,0,0);
         
    const lastIn = await db.select()
      .from(teamCheckinEvents)
      .where(
        and(
          eq(teamCheckinEvents.employeeId, empId),
          eq(teamCheckinEvents.tipo, 'IN'),
          gte(teamCheckinEvents.timestamp, startOfDay),
          lte(teamCheckinEvents.timestamp, timestampNow)
        )
      )
      .orderBy(desc(teamCheckinEvents.timestamp))
      .limit(1);

    if (lastIn.length > 0) {
      const msDiff = timestampNow.getTime() - lastIn[0].timestamp.getTime();
      const diffInHours = msDiff / (1000 * 60 * 60);
      
      const logGiorno = await db.select()
        .from(teamAttendanceLogs)
        .where(
          and(
            eq(teamAttendanceLogs.employeeId, empId),
            eq(teamAttendanceLogs.data, new Date(dataStr))
          )
        )
        .limit(1);
        
      if (logGiorno.length === 0) {
         oreCalcolate = diffInHours;
         await db.insert(teamAttendanceLogs).values({
           employeeId: empId,
           data: new Date(dataStr),
           oreLavorate: oreCalcolate.toFixed(2),
           checkIn: lastIn[0].timestamp,
           checkOut: timestampNow,
           note: 'Auto creato da Timbratura'
         });
      } else {
         oreCalcolate = parseFloat(logGiorno[0].oreLavorate || "0") + diffInHours;
         await db.update(teamAttendanceLogs)
           .set({
             oreLavorate: oreCalcolate.toFixed(2),
             checkIn: logGiorno[0].checkIn ? logGiorno[0].checkIn : lastIn[0].timestamp,
             checkOut: timestampNow
           })
           .where(eq(teamAttendanceLogs.id, logGiorno[0].id));
      }
    }
    console.log("NO BUG:", oreCalcolate);
  } catch (e) {
    console.log("BUG:", e.message);
  }
  process.exit(0);
}
run();
