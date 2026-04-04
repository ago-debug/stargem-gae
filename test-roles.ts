import { db } from "./server/db";
import { userRoles } from "./shared/schema";

async function run() {
  const roles = await db.select().from(userRoles);
  console.log(JSON.stringify(roles, null, 2));
  process.exit(0);
}
run();
