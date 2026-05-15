import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`SELECT count(*) as total FROM memberships;`);
  console.log(result);
  
  const badStrings = await db.execute(sql`SELECT count(*) as total FROM memberships WHERE membershipNumber LIKE 'CORRENTE-%' OR membershipNumber LIKE 'SUCCESSIVA-%';`);
  console.log("badStrings", badStrings);

  process.exit(0);
}

run().catch(console.error);
