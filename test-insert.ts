import "dotenv/config";
import { db } from "./server/db";
import { teamNotes } from "./shared/schema";

async function main() {
  const [insertResult] = await db.insert(teamNotes).values({
    title: "Test Note",
    content: "This is a test note to verify DB works",
    authorId: "1",
    authorName: "System Test",
    category: "generale",
    targetUrl: "/inserisci-nota"
  });
  console.log("Insert ID:", insertResult.insertId);
  const notes = await db.select().from(teamNotes);
  console.log("Total Notes:", notes.length);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
