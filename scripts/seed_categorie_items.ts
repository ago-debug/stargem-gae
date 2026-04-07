import { db } from "../server/db";
import { customLists, customListItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [list] = await db.select().from(customLists).where(eq(customLists.systemName, "categorie"));
  if (!list) {
    console.error("List 'categorie' not found!");
    process.exit(1);
  }

  const items = ["Ballo", "Fitness", "Danza", "Aerial"];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Check if it already exists
    const existing = await db.select()
      .from(customListItems)
      .where(eq(customListItems.listId, list.id));
      
    const exists = existing.some(e => e.value.toLowerCase() === item.toLowerCase());
    
    if (!exists) {
      await db.insert(customListItems).values({
        listId: list.id,
        value: item,
        sortOrder: i,
        active: true
      });
      console.log(`Inserted: ${item}`);
    } else {
      console.log(`Already exists: ${item}`);
    }
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
