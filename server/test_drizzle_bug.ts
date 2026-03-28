import "dotenv/config";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    console.log("Starting query...");
    const result = await db.select().from(users).where(eq(users.id, "admin-id"));
    console.log("Success:", result);
  } catch (e) {
    console.error("RAW NATIVE ERROR:", e);
  }
}
run().catch(console.error).finally(() => process.exit(0));
