import "dotenv/config";
import { db } from "./server/db";
import { teamCheckinEvents, teamAttendanceLogs } from "./shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

async function run() {
  try {
    const employeeId = 1;
    const tipo = "OUT";
    const bodyDate = new Date();
    
    // Simulate what POST /api/gemteam/checkin does for OUT
    const checkinRecordData: any = {
      employeeId: employeeId,
      tipo: tipo,
      timestamp: bodyDate,
      deviceInfo: "test-bot"
    };

    console.log("Inserting OUT event...");
    const [insertedRet] = await db.insert(teamCheckinEvents).values(checkinRecordData).$returningId();

    const checkInEvent = await db.select().from(teamCheckinEvents)
        .where(and(eq(teamCheckinEvents.employeeId, employeeId), eq(teamCheckinEvents.tipo, "IN"), sql`DATE(${teamCheckinEvents.timestamp}) = DATE(${bodyDate})`))
        .orderBy(desc(teamCheckinEvents.timestamp))
        .limit(1);

    if (!checkInEvent[0]) {
        console.log("No check in event found.");
        process.exit(0);
    }
    
    const outTime = bodyDate.getTime();
    const inTime = new Date(checkInEvent[0].timestamp).getTime();
    const diffHours = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
    console.log("Diff hours:", diffHours);

    const firstInEventOfDay = await db.select().from(teamCheckinEvents)
        .where(and(eq(teamCheckinEvents.employeeId, employeeId), eq(teamCheckinEvents.tipo, "IN"), sql`DATE(${teamCheckinEvents.timestamp}) = DATE(${bodyDate})`))
        .orderBy(teamCheckinEvents.timestamp)
        .limit(1);

    // Log the update operation
    await db.insert(teamAttendanceLogs).values({
        employeeId: employeeId,
        data: bodyDate,
        checkIn: firstInEventOfDay[0].timestamp,
        checkOut: bodyDate,
        oreLavorate: sql`COALESCE(ore_lavorate, 0) + ${diffHours}`,
        locked: false
    } as any).onDuplicateKeyUpdate({
        set: {
            checkOut: bodyDate,
            oreLavorate: sql`COALESCE(ore_lavorate, 0) + ${diffHours}`
        }
    });
    console.log("Done");

  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
run();
