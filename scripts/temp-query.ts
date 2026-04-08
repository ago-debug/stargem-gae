import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- FIX F: Verifica filtro allenamenti ---");
  const allenamenti = await db.execute(sql`
    SELECT e.id, e.course_id, e.member_id, c.activity_type
    FROM enrollments e
    LEFT JOIN courses c ON c.id = e.course_id
    WHERE c.activity_type = 'allenamenti';
  `);
  console.log("Allenamenti:", allenamenti[0]);

  console.log("--- FIX F: Verifica filtro prenotazioni ---");
  const prenotazioni = await db.execute(sql`
    SELECT e.id, e.course_id, e.member_id, c.activity_type
    FROM enrollments e
    LEFT JOIN courses c ON c.id = e.course_id
    WHERE c.activity_type = 'prenotazioni';
  `);
  console.log("Prenotazioni:", prenotazioni[0]);

  process.exit(0);
}
main().catch(console.error);
