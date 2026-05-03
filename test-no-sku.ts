import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq, isNull } from "drizzle-orm";

async function checkNoSku() {
  const allCourses = await db.select().from(courses).where(eq(courses.activityType, 'course'));
  
  const noSkuCourses = allCourses.filter(c => !c.sku || c.sku.trim() === '');
  const withSkuCourses = allCourses.filter(c => c.sku && c.sku.trim() !== '');
  
  console.log(`Total courses: ${allCourses.length}`);
  console.log(`With SKU: ${withSkuCourses.length}`);
  console.log(`No SKU (to delete): ${noSkuCourses.length}`);
  
  if (noSkuCourses.length > 0) {
    console.log("\nCourses WITHOUT SKU (To Delete):");
    noSkuCourses.forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name} | Day: ${c.dayOfWeek} | Time: ${c.startTime}`);
    });
  }
  process.exit(0);
}

checkNoSku().catch(console.error);
