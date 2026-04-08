import { db } from "./server/db";
import { customLists } from "./shared/schema";
import { like, or } from "drizzle-orm";

async function main() {
  const results = await db.select({
    id: customLists.id,
    name: customLists.name,
    systemName: customLists.systemName,
    listType: customLists.listType,
  })
  .from(customLists)
  .where(
    or(
      like(customLists.name, '%Genere%'),
      like(customLists.name, '%Categor%')
    )
  );
  
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}
main().catch(console.error);
