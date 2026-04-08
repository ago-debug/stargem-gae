import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runQueries() {
  console.log("--- QUERY 1 ---");
  const res1 = await db.execute(sql`SELECT COUNT(*) as tot FROM courses WHERE activity_type IS NULL;`);
  console.log(res1[0] || res1);

  console.log("--- QUERY 2 ---");
  const res2 = await db.execute(sql`
    SELECT DISTINCT lesson_type, COUNT(*) as tot
    FROM courses 
    WHERE activity_type IS NULL
    GROUP BY lesson_type
    LIMIT 20;
  `);
  console.log(res2[0] || res2);

  console.log("--- QUERY 3 ---");
  const res3 = await db.execute(sql`
    SELECT id, name, lesson_type, activity_type 
    FROM courses 
    WHERE lesson_type LIKE '%allenamenti%' 
       OR lesson_type LIKE '%prenotazioni%'
       OR lesson_type LIKE '%Privata%'
    LIMIT 10;
  `);
  console.log(res3[0] || res3);

  process.exit(0);
}

runQueries().catch(console.error);
