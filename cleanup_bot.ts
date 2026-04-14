import "dotenv/config";
import { db } from "./server/db";
import { teamCheckinEvents } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function run() {
  await db.delete(teamCheckinEvents).where(and(eq(teamCheckinEvents.employeeId, 1), eq(teamCheckinEvents.device, 'test-bot')));
  console.log("Cleanup event teamCheckinEvents completed.");
  process.exit(0);
}
run();
