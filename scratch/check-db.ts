import { db } from "./server/db";
import { courses, customListItems } from "./shared/schema";

async function run() {
  const c = await db.select({ id: courses.id, name: courses.name, categoryId: courses.categoryId }).from(courses).limit(5);
  console.log("Courses:", c);
  const cli = await db.select({ id: customListItems.id, value: customListItems.value, listId: customListItems.listId }).from(customListItems);
  console.log("CustomListItems:", cli);
  process.exit(0);
}
run();
