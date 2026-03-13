import { db } from "./server/db";
import { members } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const res = await db.select().from(members).where(and(eq(members.lastName, 'ABATE'), eq(members.firstName, 'ANNA')));
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main();
