import { db } from "../server/db";
import { courseQuotesGrid, promoRules, welfareProviders, carnetWallets } from "../shared/schema";
import { sql } from "drizzle-orm";

async function verify() {
  const c1 = await db.select({ count: sql`count(*)` }).from(courseQuotesGrid);
  const c2 = await db.select({ count: sql`count(*)` }).from(promoRules);
  const c3 = await db.select({ count: sql`count(*)` }).from(welfareProviders);
  const c4 = await db.select({ count: sql`count(*)` }).from(carnetWallets);
  
  console.log(`courseQuotesGrid: ${c1[0].count}`);
  console.log(`promoRules: ${c2[0].count}`);
  console.log(`welfareProviders: ${c3[0].count}`);
  console.log(`carnetWallets: ${c4[0].count}`);
  process.exit(0);
}
verify();
