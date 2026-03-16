import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const result = await db.select().from(courses).where(eq(courses.id, 37));
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
