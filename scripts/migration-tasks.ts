import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== TASK 1: Migrate category_id ===");
    const updateRes = await db.execute(sql`
      UPDATE courses c
      INNER JOIN categories cat ON cat.id = c.category_id
      INNER JOIN custom_list_items cli 
        ON cli.value = cat.name 
        AND cli.list_id = 23
      SET c.category_id = cli.id
      WHERE c.category_id IN (1,2,3,4,5);
    `);
    console.log("Migration executed. Affected rows:", (updateRes as any)?.[0]?.affectedRows);

    const checkRes = await db.execute(sql`
      SELECT DISTINCT category_id FROM courses
      WHERE category_id IS NOT NULL
      ORDER BY category_id;
    `);
    console.log("Distinct category_id in courses post-migration:");
    console.log(JSON.stringify((checkRes as any)?.[0] || checkRes));

    console.log("\n=== TASK 3: Analisi tabelle da eliminare ===");
    const tablesCountRes = await db.execute(sql`
      SELECT 'categories' as tabella, COUNT(*) as righe FROM categories
      UNION ALL
      SELECT 'workshops', COUNT(*) FROM workshops
      UNION ALL
      SELECT 'sunday_activities', COUNT(*) FROM sunday_activities
      UNION ALL
      SELECT 'recitals', COUNT(*) FROM recitals
      UNION ALL
      SELECT 'campus_activities', COUNT(*) FROM campus_activities
      UNION ALL
      SELECT 'individual_lessons', COUNT(*) FROM individual_lessons
      UNION ALL
      SELECT 'trainings', COUNT(*) FROM trainings;
    `);
    console.log("Tables row count:");
    console.log(JSON.stringify((tablesCountRes as any)?.[0] || tablesCountRes, null, 2));

    console.log("\n=== TASK 4: Check foreign key ===");
    const fkRes = await db.execute(sql`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'courses'
      AND COLUMN_NAME = 'category_id'
      AND REFERENCED_TABLE_NAME = 'categories';
    `);
    console.log("Foreign keys on courses(category_id) -> categories:");
    console.log(JSON.stringify((fkRes as any)?.[0] || fkRes, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
