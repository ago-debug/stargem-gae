import { db } from "../server/db";
import { categories, courses } from "../shared/schema";

async function main() {
    const cats = await db.select().from(categories);
    console.log("Categories:", cats.map(c => ({ id: c.id, name: c.name, color: c.color })));
    
    const crs = await db.select().from(courses).limit(5);
    console.log("Courses:", crs.map(c => ({ id: c.id, name: c.name, categoryId: c.categoryId })));
    process.exit(0);
}
main();
