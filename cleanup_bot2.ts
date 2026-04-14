import "dotenv/config";
import { db } from "./server/db";
import { teamAttendanceLogs } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function run() {
  await db.delete(teamAttendanceLogs).where(and(eq(teamAttendanceLogs.employeeId, 1), eq(teamAttendanceLogs.data, new Date("2026-04-14"))));
  console.log("Cleanup teamAttendanceLogs completed.");
  process.exit(0);
}
run();
