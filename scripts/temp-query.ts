import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- FIX L: Enrollments for course 473 ---");
  const enrolls = await db.execute(sql`
    SELECT id, course_id, member_id 
    FROM enrollments WHERE course_id = 473;
  `);
  console.log("Enrollments:", enrolls[0]);

  console.log("--- FIX H: Custom list item 406 ---");
  const cat = await db.execute(sql`
    SELECT id, value, list_id, color 
    FROM custom_list_items 
    WHERE id = 406;
  `);
  console.log("Category 406:", cat[0]);
  
  process.exit(0);
}
main().catch(console.error);
