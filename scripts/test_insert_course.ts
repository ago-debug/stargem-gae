import { db } from "./server/db";
import { courses } from "./shared/schema";

async function main() {
  try {
    const [result] = await db.insert(courses).values({
      name: "Test Course",
      sku: "TEST-SKU-1",
      lessonType: ["vvv2222"],
      statusTags: ["STATE:ATTIVO"]
    });
    console.log("Success:", result);
  } catch (err: any) {
    console.error("Error inserting course:");
    console.error(err.message);
  }
  process.exit(0);
}
main();
