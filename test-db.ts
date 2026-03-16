import { db } from "./server/db";
import { bookingServiceCategories } from "./shared/schema";

async function run() {
  try {
    console.log("Starting DB insert...");
    const [result] = await db.insert(bookingServiceCategories).values({
      name: "TestCategory",
      description: null,
      parentId: null,
      color: null
    } as any);
    console.log("DB Insert success:", result);
    const id = (result as any).insertId || (result as any).id;
    console.log("Inserted ID:", id);
    process.exit(0);
  } catch (err) {
    console.error("DB Insert Exception:", err);
    process.exit(1);
  }
}

run();
