import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  await db.update(users).set({ username: "Bot AI" }).where(eq(users.username, "bot"));
  console.log("Renamed bot user to 'Bot AI'!");
  process.exit(0);
}
run();
