import { courses } from "../shared/schema";
import { db } from "../server/db";

async function main() {
  const dataToSave = {
    sku: "testGae1234",
    name: "pippo",
    categoryId: null,
    studioId: null,
    instructorId: null,
    secondaryInstructor1Id: null,
    price: "1610.40",
    maxCapacity: null,
    dayOfWeek: "MAR",
    startTime: "08:00",
    endTime: "09:00",
    recurrenceType: "single",
    schedule: null,
    startDate: null,
    endDate: null,
    level: "44",
    ageGroup: '["STATE:ATTIVO"]',
    lessonType: '["vvv2222"]',
    numberOfPeople: null,
    statusTags: '[]',
    active: true
  };

  try {
    const query = db.insert(courses).values(dataToSave as any).toSQL();
    console.log("Query SQL:", query.sql);
    const [res] = await db.insert(courses).values(dataToSave as any);
    console.log("Success:", res);
  } catch (e) {
    console.error("Execute error:", e);
  }
}

main().then(() => process.exit(0)).catch(console.error);
