import "dotenv/config";
import { db } from "../server/db";
import { courses, individualLessons, trainings, InsertCourse } from "../shared/schema";

async function runDataPump() {
  console.log("🚀 Inizio Data Pump (Protocollo 012) - Trasferimento Silos a STI...");

  // Lettura sicura da silos usando Drizzle per auto-mapping camelCase
  const allenamentiRows = await db.select().from(trainings);
  const lezioniRows = await db.select().from(individualLessons);

  console.log(`📊 Trovati ${allenamentiRows.length} allenamenti storici.`);
  console.log(`📊 Trovati ${lezioniRows.length} lezioni individuali storiche.`);

  if (allenamentiRows.length === 0 && lezioniRows.length === 0) {
    console.log("ℹ️ Nessun record nei custom silos. Data Pump terminato a vuoto.");
    process.exit(0);
  }

  try {
    // Transazione atomica Drizzle: fallimento = rollback completo
    await db.transaction(async (tx) => {
      let counterAllenamenti = 0;
      let counterLezioni = 0;

      for (const t of allenamentiRows) {
        // Mapping pulito Drizzle -> Drizzle
        await tx.insert(courses).values({
          name: t.name || 'Allenamento Storico',
          description: t.description,
          studioId: t.studioId,
          instructorId: t.instructorId,
          price: t.price ? t.price.toString() : null,
          startTime: t.startTime,
          endTime: t.endTime,
          recurrenceType: t.recurrenceType,
          schedule: t.schedule,
          startDate: t.startDate,
          endDate: t.endDate,
          statusTags: t.statusTags,
          active: t.active,
          seasonId: t.seasonId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          activityType: 'allenamenti',
        } as InsertCourse);
        counterAllenamenti++;
      }

      for (const l of lezioniRows) {
        await tx.insert(courses).values({
          name: l.name || 'Lezione Storica',
          description: l.description,
          studioId: l.studioId,
          instructorId: l.instructorId,
          price: l.price ? l.price.toString() : null,
          startTime: l.startTime,
          endTime: l.endTime,
          recurrenceType: l.recurrenceType,
          schedule: l.schedule,
          startDate: l.startDate,
          endDate: l.endDate,
          statusTags: l.statusTags,
          active: l.active,
          seasonId: l.seasonId,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          activityType: 'prenotazioni', // Match della query activityType F2
        } as InsertCourse);
        counterLezioni++;
      }

      console.log(`✅ Data Pump Completato! Inject: ${counterAllenamenti} Allenamenti, ${counterLezioni} Lezioni.`);
    });
  } catch (err) {
    console.error("❌ ERRORE CRITICO! Il Data Pump è fallito. Nessun record modificato (ROLLBACK effettuato).", err);
    process.exit(1);
  }

  process.exit(0);
}

runDataPump().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
