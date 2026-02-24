import { db } from "./server/db";
import { users } from "./shared/schema";

async function listUsers() {
  const allUsers = await db.select().from(users);
  console.log("USERS:", allUsers.map(u => ({ id: u.id, username: u.username })));
  process.exit(0);
}

listUsers().catch(console.error);
