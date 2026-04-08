import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- FIX F: Conteggio Iscritti per Tipo ---");
  const res = await db.execute(sql`
    SELECT c.activity_type, COUNT(e.id) as tot
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    GROUP BY c.activity_type;
  `);
  console.log("Conteggi:", res[0]);
  process.exit(0);
}
main().catch(console.error);
