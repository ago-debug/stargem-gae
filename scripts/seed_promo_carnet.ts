import { db } from "../server/db";
import { promoRules, carnetWallets } from "../shared/schema";

async function seed() {
  console.log("Seeding Promo Rules and Carnets for active season...");

  // Assume season_id = 1 is the active 25-26 season
  const seasonId = 1;

  for (let i = 1; i <= 10; i++) {
    await db.insert(promoRules).values({
      code: `PROMO_MOCK_${i}_${Date.now()}`,
      label: `Promozione Speciale ${i}`,
      ruleType: "percentage",
      value: "10.00",
      validFrom: "2025-09-01",
      validTo: "2026-06-30",
      maxUses: 100,
      usedCount: Math.floor(Math.random() * 20),
      excludeOpen: false,
      notCumulative: true,
      targetType: "public",
      seasonId: seasonId,
    });

    await db.insert(carnetWallets).values({
      memberId: 1, // Assumendo che esista il member 1
      walletTypeId: 115, // Id reale trovato a db
      totalUnits: 10,
      usedUnits: Math.floor(Math.random() * 10),
      expiryDays: 30,
      purchasedAt: "2025-10-01",
      expiresAt: "2026-06-30",
      isActive: true,
      seasonId: seasonId,
      pricePerUnit: "15.00",
      totalPaid: "150.00",
    });
  }

  console.log("Seeding completed successfully.");
}

seed().catch(console.error).finally(() => process.exit(0));
