import { db } from "../server/db";
import { courses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const result = await db.select({
    id: courses.id,
    name: courses.name,
    category_id: courses.categoryId,
    activity_type: courses.activityType
  }).from(courses).where(eq(courses.id, 473));
  console.log("RESULT:", result);
  process.exit(0);
}
main().catch(e => console.error(e));
