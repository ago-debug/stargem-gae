import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const [user] = await db.select().from(users).where(eq(users.username, "botAI"));
  if (user) {
    console.log(`id: ${user.id}, username: ${user.username}, role: ${user.role}, password: ${user.password}`);
  } else {
    console.log("No botAI user found");
  }
  process.exit(0);
}
run();
