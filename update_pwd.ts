import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./server/auth";

async function run() {
  const pw = await hashPassword("botAI123!");
  await db.update(users).set({ password: pw }).where(eq(users.username, "botAI"));
  console.log("Updated password for botAI to botAI123!");
  process.exit(0);
}
run().catch(console.error);
