import { db } from "../db";
import { teamScheduledShifts, teamShiftTemplates } from "../../shared/schema";

async function main() {
  console.log("Wiping dirty shift data from database...");
  await db.delete(teamScheduledShifts);
  await db.delete(teamShiftTemplates);
  console.log("Wipe completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Wipe failed:", err);
  process.exit(1);
});
