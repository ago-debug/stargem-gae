import "dotenv/config";
import { db } from "../server/db";
import { courseQuotesGrid, promoRules, welfareProviders, carnetWallets } from "../shared/schema";

async function run() {
  const c = await db.select().from(courseQuotesGrid);
  console.log("Quotes Grid count:", c.length);
  
  const p = await db.select().from(promoRules);
  console.log("Promo count:", p.length);
  
  const w = await db.select().from(welfareProviders);
  console.log("Welfare count:", w.length);
  
  const cw = await db.select().from(carnetWallets);
  console.log("Carnet count:", cw.length);
  
  process.exit(0);
}
run();
