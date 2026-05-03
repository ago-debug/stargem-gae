import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq, inArray } from "drizzle-orm";

async function deleteDirty() {
  const idsToDelete = [532, 534, 535, 536, 537, 538, 541, 542, 543, 544, 545, 546, 547, 548, 553, 582, 587, 632, 641, 698, 823, 824, 825, 826, 827];
  
  await db.delete(courses).where(inArray(courses.id, idsToDelete));
  console.log(`Deleted ${idsToDelete.length} courses successfully.`);
  process.exit(0);
}

deleteDirty().catch(console.error);
