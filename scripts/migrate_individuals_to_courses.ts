import { db } from "../server/db";
import { courses, individualLessons, trainings, type InsertCourse } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("[Migrate] Inizio migrazione da silos a courses STI...");

  // 1. Migrate Individual Lessons
  const oldIndividuals = await db.select().from(individualLessons);
  let indCount = 0;
  for (const item of oldIndividuals) {
    const dataToSave = {
      sku: item.sku,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      studioId: item.studioId,
      instructorId: item.instructorId,
      secondaryInstructor1Id: item.secondaryInstructor1Id,
      price: item.price ? item.price : "0.00",
      maxCapacity: item.maxCapacity,
      currentEnrollment: item.currentEnrollment,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      recurrenceType: item.recurrenceType,
      schedule: item.schedule,
      startDate: item.startDate,
      endDate: item.endDate,
      level: item.level,
      ageGroup: item.ageGroup,
      lessonType: '["prenotazioni"]' as any,
      numberOfPeople: item.numberOfPeople,
      statusTags: item.statusTags ? JSON.stringify(item.statusTags) as any : '[]',
      active: item.active,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };

    await db.insert(courses).values(dataToSave as any);
    await db.delete(individualLessons).where(eq(individualLessons.id, item.id));
    indCount++;
  }
  console.log(`[Migrate] Migrati e rimossi ${indCount} Lezioni Individuali.`);

  // 2. Migrate Trainings
  const oldTrainings = await db.select().from(trainings);
  let trainCount = 0;
  for (const item of oldTrainings) {
    const dataToSave = {
      sku: item.sku,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      studioId: item.studioId,
      instructorId: item.instructorId,
      secondaryInstructor1Id: item.secondaryInstructor1Id,
      price: item.price ? item.price : "0.00",
      maxCapacity: item.maxCapacity,
      currentEnrollment: item.currentEnrollment,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      recurrenceType: item.recurrenceType,
      schedule: item.schedule,
      startDate: item.startDate,
      endDate: item.endDate,
      level: item.level,
      ageGroup: item.ageGroup,
      lessonType: '["allenamenti"]' as any,
      statusTags: item.statusTags ? JSON.stringify(item.statusTags) as any : '[]',
      active: item.active,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };

    await db.insert(courses).values(dataToSave as any);
    await db.delete(trainings).where(eq(trainings.id, item.id));
    trainCount++;
  }
  console.log(`[Migrate] Migrati e rimossi ${trainCount} Allenamenti.`);
  console.log("[Migrate] Finito!");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
