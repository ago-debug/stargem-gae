import { db } from "../server/db";
import { teamNotes } from "../shared/schema";
import { desc, like } from "drizzle-orm";

async function main() {
  const notes = await db.select().from(teamNotes).orderBy(desc(teamNotes.id)).limit(20);
  console.log(JSON.stringify(notes, null, 2));
  process.exit(0);
}

main();
