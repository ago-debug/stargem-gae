import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const [res] = await db.execute(sql`SELECT * FROM dossier_steps LIMIT 5;`);
  console.log(res);
  process.exit(0);
}
run();
