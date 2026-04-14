import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  await db.update(users).set({ role: "admin" }).where(eq(users.username, "botAI"));
  console.log("botAI role updated to admin");
  process.exit(0);
}
run();
