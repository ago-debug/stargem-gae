import { db } from "./server/db";
import { bookingServiceCategories } from "./shared/schema";

async function run() {
  try {
    const [result] = await db.insert(bookingServiceCategories).values({
      name: "Test Direct Insert",
    } as any);
    console.log("Success:", result);
  } catch (err) {
    console.error("DB Error Details:");
    console.error(err);
  }
  process.exit(0);
}

run();
