import { db } from "../server/db";
import { users } from "../shared/schema";

async function run() {
  const allUsers = await db.select().from(users);
  console.log("Registered Users:", allUsers.map(u => u.username));
}
run().then(() => process.exit(0));
