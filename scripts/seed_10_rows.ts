import { db } from "../server/db";
import { courseQuotesGrid, promoRules, welfareProviders, carnetWallets, members } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  try {
    let member = await db.query.members.findFirst();
    let memberId = 1;
    if (!member) {
      console.log("No members found, creating a dummy member...");
      const res = await db.insert(members).values({
        firstName: "Test",
        lastName: "Allievo",
        email: "test@example.com",
        status: "attivo"
      });
      memberId = res[0].insertId;
    } else {
      memberId = member.id;
    }

    console.log("Seeding Carnets (10 rows) with purchased_at...");
    const carnetData = Array.from({ length: 10 }).map((_, i) => ({
      memberId: memberId,
      walletTypeId: 1, 
      totalUnits: 10,
      usedUnits: i,
      expiryDays: 90,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }));
    await db.execute(sql`SET FOREIGN_KEY_CHECKS=0;`);
    await db.insert(carnetWallets).values(carnetData);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS=1;`);

    console.log("Seeding Carnets complete!");
  } catch (e) { console.error("Error:", e); }
}

seed();
