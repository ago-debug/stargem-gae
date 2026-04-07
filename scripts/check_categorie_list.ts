import { db } from "../server/db";
import { customLists } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const existing = await db.select().from(customLists).where(eq(customLists.systemName, "categorie"));
  console.log(JSON.stringify(existing));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
