import "dotenv/config";
import { db } from "./server/db";
import { eq } from "drizzle-orm";
import { users } from "./shared/schema";

async function run() {
  try {
    const start = Date.now();
    const res = await db.select().from(users).where(eq(users.username, "admin"));
    console.log("Success:", res);
    console.log("Time:", Date.now() - start);
  } catch (e) {
    console.log("Name:", e.name);
    console.log("Message:", e.message);
    if (e.cause) {
       console.log("Cause name:", e.cause.name);
       console.log("Cause msg:", e.cause.message);
    }
  }
  process.exit(0);
}
run();
