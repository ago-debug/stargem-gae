import { db } from "./server/db";
import { courses } from "./shared/schema";

async function run() {
  try {
    const [result] = await db.insert(courses).values({
      name: "Allenamento DB Test",
      sku: "DB-TEST-001",
      seasonId: 3,
      dayOfWeek: "LUN",
      startTime: "10:00",
      endTime: "11:00",
      studioId: 1,
      lessonType: JSON.stringify(["Cardio"]) as any,
      statusTags: JSON.stringify(["STATE:ATTIVO"]) as any,
      active: true,
      startDate: null,
      endDate: null,
    });
    console.log("Success:", result);
  } catch (err) {
    console.error("DB Insert Error Details:");
    console.error(err);
  }
}
run().then(() => process.exit(0));
