import "dotenv/config";
import { db } from "../server/db";
import { customLists } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const listData = { systemName: "generi_lezioni_individuali", name: "Generi Lezioni Individuali" };

  let listQuery = await db.select().from(customLists).where(eq(customLists.systemName, listData.systemName)).limit(1);
  if (listQuery.length === 0) {
    const [res] = await db.insert(customLists).values(listData);
    console.log(`Created list ${listData.systemName}`);
  } else {
    console.log(`List ${listData.systemName} already exists`);
  }

  process.exit(0);
}
run();
