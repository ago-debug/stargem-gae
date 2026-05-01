import { db } from "./server/db";
import { users } from "./shared/schema";

async function list() {
  const all = await db.select().from(users);
  console.log(all.map(u => ({ id: u.id, username: u.username, role: u.role })));
  process.exit(0);
}
list().catch(console.error);
