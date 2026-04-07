import { db } from "./db/index";
import { members } from "./shared/schema";
import { eq, or } from "drizzle-orm";

async function main() {
  const res = await db.select().from(members).where(or(
    eq(members.fiscalCode, "SADAFSFAFARAFASF"),
    eq(members.email, "ga@sdfgsdg.it"),
    eq(members.firstName, "babbo")
  ));
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main().catch(console.error);
