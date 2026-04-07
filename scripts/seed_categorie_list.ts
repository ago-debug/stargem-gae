import { db } from "../server/db";
import { customLists } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const existing = await db.select().from(customLists).where(eq(customLists.systemName, "categorie"));
  if (existing.length === 0) {
    await db.insert(customLists).values({
      name: "Categorie",
      systemName: "categorie",
      systemCode: "CAT",
      description: "Categorie unificate per tutte le attività"
    });
    console.log("Creata lista Categorie in Elenchi Semplici.");
  } else {
    console.log("Categoria già presente.");
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
