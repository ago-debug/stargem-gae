import { db, pool } from "../server/db";
import { courses } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    let course = await db.query.courses.findFirst({
      where: eq(courses.name, "Corso Storico Importazioni")
    });
    if (!course) {
      const res = await db.insert(courses).values({
        name: "Corso Storico Importazioni",
        description: "Corso fittizio per le iscrizioni importate dal vecchio gestionale.",
        active: false,
        activeOnHolidays: 0
      });
      console.log("Created course ID:", res[0].insertId);
    } else {
      console.log("Course already exists, ID:", course.id);
    }
  } catch (e) {
    console.log(e);
  } finally {
    pool.end();
  }
}
main();
