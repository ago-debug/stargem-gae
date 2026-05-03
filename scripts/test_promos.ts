import "dotenv/config";
import { db } from "../server/db";
import { promoRules } from "../shared/schema";
async function run() {
  const p = await db.select().from(promoRules);
  console.log(p.map(x => x.code));
  process.exit(0);
}
run();
