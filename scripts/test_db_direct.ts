import { db } from "../server/db";
import { courses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const dataToSave = {
      name: "Allenamento BotAI",
      lessonType: JSON.stringify(["Cardio", "Pesistica"]) as any,
      seasonId: 3, 
      dayOfWeek: "LUN",
      startTime: "10:00",
      endTime: "11:00",
      studioId: 1,
      statusTags: JSON.stringify(["STATE:ATTIVO"]) as any,
      active: true,
      sku: "BOT-TEST-001"
    } as any;

    const [result] = await db.insert(courses).values(dataToSave);
    console.log("Success:", result);
  } catch (err: any) {
    console.error("DB Error Message:");
    console.error(err.message);
  }
  process.exit(0);
}
main();
