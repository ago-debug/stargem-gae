import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- FIX CAMPUS: Verifica activity_type=campus ---");
  const res = await db.execute(sql`
    SELECT id, name, activity_type 
    FROM courses 
    WHERE activity_type = 'campus';
  `);
  console.log("Campus trovati:", res[0]);

  console.log("--- FIX CAMPUS: Tutti i tipi presenti nel DB ---");
  const tipi = await db.execute(sql`
    SELECT DISTINCT activity_type, COUNT(*) as tot
    FROM courses
    GROUP BY activity_type
    ORDER BY tot DESC;
  `);
  console.log("Tipi:", tipi[0]);

  process.exit(0);
}
main().catch(console.error);
