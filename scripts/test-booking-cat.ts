import { db } from "../server/db";
import { insertBookingServiceCategorySchema } from "../shared/schema";

async function test() {
  try {
    const data = insertBookingServiceCategorySchema.parse({
      name: "Visite Mediche",
      description: "Test",
      parentId: null,
      color: "#ff0000"
    });
    console.log("Parsed Data:", data);
  } catch (err) {
    console.error("Zod Validation Error:", err);
  }
}

test().catch(console.error);
