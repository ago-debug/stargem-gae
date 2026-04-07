import { db } from "../server/db";
import { courses, customLists, customListItems, individualLessons, trainings } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("[Sync] Inizio... nomi corsi -> custom_list_items");
  const allCourses = await db.select().from(courses);
  const allIndividual = await db.select().from(individualLessons);
  const allTrainings = await db.select().from(trainings);
  
  const sets: Record<string, Set<string>> = {
    generi_lezioni_individuali: new Set(allIndividual.map(i => i.name).filter(Boolean) as string[]),
    generi_allenamenti: new Set(allTrainings.map(t => t.name).filter(Boolean) as string[]),
    nomi_corsi: new Set()
  };

  for (const course of allCourses) {
    if (!course.name) continue;
    let targetList = "nomi_corsi";
    try {
      const types = Array.isArray(course.lessonType) ? course.lessonType : (course.lessonType ? JSON.parse(course.lessonType as string) : []);
      if (types.includes("prenotazioni") || types.includes("Lezione Individuale") || types.includes("Privata")) targetList = "generi_lezioni_individuali";
      if (types.includes("allenamenti") || types.includes("Allenamento")) targetList = "generi_allenamenti";
    } catch(e) {}
    sets[targetList].add(course.name);
  }

  for (const [systemName, namesSet] of Object.entries(sets)) {
    let listHeader = await db.query.customLists.findFirst({
      where: eq(customLists.systemName, systemName)
    });

    if (!listHeader) {
      const [insertHeader] = await db.insert(customLists).values({ name: systemName, systemName });
      listHeader = await db.query.customLists.findFirst({ where: eq(customLists.id, (insertHeader as any).insertId) });
    }

    if (!listHeader) continue;

    const existingItems = await db.select().from(customListItems).where(eq(customListItems.listId, listHeader.id));
    const existingValues = new Set(existingItems.map(i => i.value.trim().toLowerCase()));

    let added = 0;
    for (const name of namesSet) {
      if (!existingValues.has(name.trim().toLowerCase())) {
        await db.insert(customListItems).values({ listId: listHeader.id, value: name.trim(), active: true, sortOrder: 0 });
        existingValues.add(name.trim().toLowerCase());
        added++;
      }
    }
    console.log(`[Sync] ${systemName}: Aggiunte ${added} nuove voci alla lista ID ${listHeader.id}.`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
