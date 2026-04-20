import { db } from "./server/db";
import * as schema from "./shared/schema";
import { sql } from "drizzle-orm";

async function run() {
  const allShifts = await db.select({
     count: sql`COUNT(*)`.mapWith(Number),
     employeeId: schema.teamScheduledShifts.employeeId
  }).from(schema.teamScheduledShifts)
    .groupBy(schema.teamScheduledShifts.employeeId);

  const total = allShifts.reduce((acc, row) => acc + row.count, 0);
  console.log(`\n=== RECORD TOTALI TURNI: ${total} ===`);
  for (const row of allShifts) {
     console.log(`Dipendente ID ${row.employeeId}: ${row.count} record(s)`);
  }
  process.exit(0);
}
run();
