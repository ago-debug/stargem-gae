import { db } from "../server/db";
import { courseQuotesGrid } from "../shared/schema";
import { sql, eq } from "drizzle-orm";

async function fix() {
  await db.update(courseQuotesGrid).set({ activityType: "open" }).where(eq(courseQuotesGrid.category, "OPEN"));
  await db.update(courseQuotesGrid).set({ activityType: "bambini" }).where(eq(courseQuotesGrid.category, "BAMBINI"));
  await db.update(courseQuotesGrid).set({ activityType: "aerial" }).where(eq(courseQuotesGrid.category, "AERIAL"));
  await db.update(courseQuotesGrid).set({ activityType: "adulti" }).where(eq(courseQuotesGrid.category, "ADULTI"));
  console.log("Fixed activityTypes");
  process.exit(0);
}
fix();
