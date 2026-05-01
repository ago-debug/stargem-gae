import "dotenv/config";
import { db } from "./server/db";
import { teamAttendanceLogs, teamCheckinEvents } from "./shared/schema";

async function run() {
  try {
    await db.insert(teamAttendanceLogs).values({
        employeeId: 1,
        data: new Date("2026-04-14"),
        oreLavorate: "0.02",
        checkIn: new Date(),
        checkOut: new Date(),
        note: 'Auto creato da Timbratura'
    });
    console.log("SUCCESS");
  } catch(e) {
    console.log("SQL ERROR:", e.cause);
  }
  process.exit(0);
}
run();
