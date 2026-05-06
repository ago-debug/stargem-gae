import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import Papa from "papaparse";
import path from "path";

async function main() {
  const res = await db.execute(sql`SELECT id, name, sku FROM courses WHERE active = 1 AND season_id = 3`); // Assuming season_id 3 is 25-26, or just active=1
  console.log("DB Active Courses (Count):", res[0].length);
  // console.log(res[0]);

  const FILE_3 = path.join(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input/estrap_2026-04-15_ElencoPartecipazioni_Athena - ElencoIscrizioni copia.csv");
  const content = fs.readFileSync(FILE_3, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  const athenaCourses = new Set();
  for (const row of parsed.data as any) {
    if (row["Corso"]) athenaCourses.add(row["Corso"]);
  }
  console.log("Athena Unique Courses:", Array.from(athenaCourses).slice(0, 10));

  const FILE_2 = path.join(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input/estrap_2026-05-04_estrapolazione_Master_Gsheet - importazione copia.csv");
  const content2 = fs.readFileSync(FILE_2, "utf-8");
  const parsed2 = Papa.parse(content2, { header: true, skipEmptyLines: true });

  const masterCourses = new Set();
  for (const row of parsed2.data as any) {
    if (row["sz1_descrizione_quota"]) masterCourses.add(row["sz1_descrizione_quota"]);
  }
  console.log("Master Gsheet Unique Descrizioni:", Array.from(masterCourses).slice(0, 10));

  process.exit(0);
}
main();
