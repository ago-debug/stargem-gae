import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./server/auth";

async function run() {
  const pwd = await hashPassword("Password123!");
  await db.update(users).set({ password: pwd }).where(eq(users.username, "botAI"));
  console.log("Password changed to Password123!");
  process.exit(0);
}
run();
