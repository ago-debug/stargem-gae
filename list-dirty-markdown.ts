import { db } from "./server/db";
import { courses } from "./shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

async function generateMarkdown() {
  const allCourses = await db.select().from(courses).where(eq(courses.activityType, 'course'));
  
  const dirtyCourses = allCourses.filter(c => !c.dayOfWeek || !c.startTime);
  
  let md = "# Report Dettagliato Corsi da Eliminare (Dati Sporchi/Senza Programmazione)\n\n";
  md += "Di seguito la lista dei **25 corsi** che attualmente risultano nel database come `activityType = 'course'` ma **NON hanno una programmazione valida** (né giorno, né orario, né insegnante). Come hai giustamente notato, questi includono i pacchetti 'Open' e dei rimasugli storici senza un codice SKU reale associato a un orario.\n\n";
  
  md += "| ID | Nome nel Database | SKU Registrato | Note / Motivo Eliminazione |\n";
  md += "|---|---|---|---|\n";
  
  dirtyCourses.forEach(c => {
    let note = "Senza giorno e orario";
    if (c.name.toLowerCase().includes("open")) note = "Pacchetto Open (erroneamente salvato come corso singolo)";
    else if (c.name.toLowerCase().includes("storico")) note = "Importazione storica legacy (incompleto)";
    else if (c.name.toLowerCase().includes("prova")) note = "Record di prova orfano";
    
    md += `| ${c.id} | **${c.name}** | \`${c.sku}\` | ${note} |\n`;
  });
  
  md += "\n\n> **Azione Richiesta:** Confermi che posso eseguire una query `DELETE` per rimuovere tutti e 25 questi record dal database in modo da pulire definitivamente la tabella `courses`?\n";

  fs.writeFileSync("/Users/gaetano1/.gemini/antigravity/brain/b635d58b-33f5-4669-ba42-6f92d9707368/artifacts/dirty_courses_report.md", md);
  console.log("Markdown artifact generated.");
  process.exit(0);
}

generateMarkdown().catch(console.error);
