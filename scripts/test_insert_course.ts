import "dotenv/config";
import { db } from "../server/db";
import { courses } from "../shared/schema";

async function run() {
  try {
    await db.insert(courses).values({
      name: "Test Course",
      price: "10.00",
      statusTags: ["STATE:ATTIVO"],
      lessonType: ["test"],
      active: true,
    });
    console.log("Success");
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
  process.exit(0);
}
run();
