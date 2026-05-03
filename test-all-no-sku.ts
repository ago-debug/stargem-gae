import { db } from "./server/db";
import { courses } from "./shared/schema";
import { isNull } from "drizzle-orm";

async function checkAllNoSku() {
  const allCourses = await db.select().from(courses);
  
  const noSkuCourses = allCourses.filter(c => !c.sku || c.sku.trim() === '');
  
  console.log(`Total records in 'courses' table: ${allCourses.length}`);
  console.log(`Records WITHOUT SKU (to delete): ${noSkuCourses.length}`);
  
  if (noSkuCourses.length > 0) {
    console.log("\nRecords WITHOUT SKU (To Delete):");
    noSkuCourses.forEach(c => {
      console.log(`ID: ${c.id} | Type: ${c.activityType} | Name: ${c.name}`);
    });
  }
  process.exit(0);
}

checkAllNoSku().catch(console.error);
