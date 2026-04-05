import "dotenv/config";
import { db } from "../server/db";
import { activities, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function run() {
  const allActs = await db.select({ id: activities.id, name: activities.name }).from(activities);
  console.log("Activities:\n", JSON.stringify(allActs, null, 2));
  
  const allUsers = await db.select({ id: users.id, username: users.username, first: users.firstName, last: users.lastName }).from(users);
  console.log("Users:\n", JSON.stringify(allUsers, null, 2));
  process.exit(0);
}
run();
