import { db, pool } from "../server/db";
import { members, enrollments, courses } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import Papa from "papaparse";
import path from "path";

async function main() {
  const OUT_DIR = path.resolve(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input");
  
  console.log("Estrazione Anagrafiche...");
  const allMembers = await db.select().from(members);
  const membersCsv = Papa.unparse(allMembers);
  fs.writeFileSync(path.join(OUT_DIR, "export_TEST_members.csv"), membersCsv, "utf-8");
  console.log(`Esportate ${allMembers.length} anagrafiche in export_TEST_members.csv`);

  console.log("Estrazione Iscrizioni...");
  const allEnrollments = await db.select({
    enrollmentId: enrollments.id,
    memberId: members.id,
    firstName: members.firstName,
    lastName: members.lastName,
    fiscalCode: members.fiscalCode,
    cardNumber: members.cardNumber,
    courseName: courses.name,
    courseSku: courses.sku,
    status: enrollments.status,
    sourceFile: enrollments.sourceFile,
    gsheetDescrizioneQuota: enrollments.gsheetDescrizioneQuota,
    gsheetChiScrive: enrollments.gsheetChiScrive,
    gsheetVendita: enrollments.gsheetVendita,
    athenaStatoIscrizione: enrollments.athenaStatoIscrizione
  })
  .from(enrollments)
  .leftJoin(members, eq(enrollments.memberId, members.id))
  .leftJoin(courses, eq(enrollments.courseId, courses.id));

  const enrollmentsCsv = Papa.unparse(allEnrollments);
  fs.writeFileSync(path.join(OUT_DIR, "export_TEST_enrollments.csv"), enrollmentsCsv, "utf-8");
  console.log(`Esportate ${allEnrollments.length} iscrizioni in export_TEST_enrollments.csv`);

  await pool.end();
}
main();
