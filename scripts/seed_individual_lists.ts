import "dotenv/config";
import { db } from "../server/db";
import { customLists, customListItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const listsToCreate = [
    { systemName: "tipologia_lezioni", name: "Tipologie Lezioni Individuali" },
    { systemName: "numero_persone", name: "Numero Persone (Individuali)" }
  ];

  for (const listData of listsToCreate) {
    let listQuery = await db.select().from(customLists).where(eq(customLists.systemName, listData.systemName)).limit(1);
    let listId;
    if (listQuery.length === 0) {
      const [res] = await db.insert(customLists).values(listData);
      listId = res.insertId;
      console.log(`Created list ${listData.systemName}`);
    } else {
      listId = listQuery[0].id;
      console.log(`List ${listData.systemName} already exists`);
    }
  }

  process.exit(0);
}
run();
