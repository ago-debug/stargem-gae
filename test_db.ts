import { db } from "./server/db";
import { users } from "./shared/schema";
async function getAdmin() {
  const allUsers = await db.select().from(users).limit(1);
  console.log(allUsers[0]);
  process.exit(0);
}
getAdmin();
