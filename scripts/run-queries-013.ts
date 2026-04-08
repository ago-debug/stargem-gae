import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runQueries() {
  console.log("--- Query 1: SALSA e records sospetti ---");
  const res1 = await db.execute(sql`
    SELECT id, name, lesson_type, category_id, instructor_id, activity_type
    FROM courses 
    WHERE activity_type IS NULL
    AND (
      lesson_type != '[]' 
      OR name LIKE '%Salsa%'
      OR name LIKE '%Personal%'
      OR name LIKE '%Privat%'
      OR name LIKE '%Allenamento%'
    )
    LIMIT 20;
  `);
  console.log(res1[0] || res1);

  console.log("--- Query 2: Conteggio NULL per categoria ---");
  const res2 = await db.execute(sql`
    SELECT category_id, COUNT(*) as tot
    FROM courses
    WHERE activity_type IS NULL
    GROUP BY category_id
    ORDER BY tot DESC
    LIMIT 10;
  `);
  console.log(res2[0] || res2);

  console.log("--- Query 3: Categorie Esistenti ---");
  const res3 = await db.execute(sql`
    SELECT id, name FROM categories LIMIT 20;
  `);
  console.log(res3[0] || res3);

  process.exit(0);
}

runQueries().catch(console.error);
