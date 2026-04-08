import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- BUG N: Verifica custom_lists campus/group ---");
  const exists = await db.execute(sql`
    SELECT id, name, system_name 
    FROM custom_lists 
    WHERE system_name LIKE '%campus%'
       OR system_name LIKE '%group%'
       OR system_name LIKE '%gruppo%';
  `);
  console.log("Liste trovate:", exists[0]);

  if ((exists[0] as unknown as any[]).length === 0) {
    console.log("Nessuna lista trovata → Creo 'gruppi_campus'...");
    await db.execute(sql`
      INSERT INTO custom_lists (name, system_name, description)
      VALUES ('Gruppi Campus', 'gruppi_campus', 'Gruppi per i campus estivi');
    `);
    const created = await db.execute(sql`
      SELECT id, name, system_name FROM custom_lists WHERE system_name = 'gruppi_campus';
    `);
    console.log("Lista creata:", created[0]);
  } else {
    console.log("Lista già presente — nessuna creazione necessaria.");
  }

  process.exit(0);
}
main().catch(console.error);
