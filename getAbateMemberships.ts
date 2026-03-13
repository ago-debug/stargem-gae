import { db } from "./server/db";
import { memberships, members } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const member = await db.select().from(members).where(eq(members.lastName, 'ABATE'));
  if (member.length > 0) {
    const res = await db.select().from(memberships).where(eq(memberships.memberId, member[0].id));
    console.log("Memberships for ABATE:", JSON.stringify(res, null, 2));
  }
  process.exit(0);
}
main();
