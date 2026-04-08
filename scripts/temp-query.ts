import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  // Eseguo la DELETE
  await db.execute(sql`
    DELETE FROM courses 
    WHERE id IN (469, 470, 471);
  `);
  
  // Verifico
  const res = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM courses
    WHERE activity_type IN (
      'recitals','sunday_activities','vacation_studies'
    );
  `);
  
  console.log("Delete completata.");
  console.log("Record residui per tipi obsoleti:", res[0][0].count ?? res[0][0]);
  process.exit(0);
}
main().catch(console.error);
