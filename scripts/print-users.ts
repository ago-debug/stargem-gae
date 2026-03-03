import { db } from "../server/db";
import { users } from "../shared/schema";
import { scryptSync } from "crypto";

async function run() {
  const allUsers = await db.select().from(users);
  console.log("Registered Users:", allUsers.map(u => ({ username: u.username, role: u.role })));
}
run().then(() => process.exit(0));
