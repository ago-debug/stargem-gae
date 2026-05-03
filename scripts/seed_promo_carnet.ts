import { db } from "../server/db";
import { promoRules, carnetWallets, staffRates, companyAgreements, instructorAgreements } from "../shared/schema";

async function seed() {
  console.log("Seeding Promo Rules, Carnets, Staff Rates, Company Agreements and Instructor Agreements for active season...");

  // Assume season_id = 1 is the active 25-26 season
  const seasonId = 1;

  for (let i = 1; i <= 10; i++) {
    // 1. Promo Rules
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
    }).catch(() => {}); // ignore duplicates

    // 2. Carnet Wallets
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

    // 3. Staff Rates
    await db.insert(staffRates).values({
      serviceCode: `SR_${i}_${Date.now()}`,
      serviceLabel: `Servizio Staff ${i}`,
      amount: "25.00",
      rateType: "annual",
      applicableTo: "all_staff",
      seasonId: seasonId,
      requiresMembership: true,
      requiresMedicalCert: true,
      isActive: true,
    });

    // 4. Company Agreements
    await db.insert(companyAgreements).values({
      companyName: `Azienda Convenzionata ${i} S.p.A.`,
      companyType: "corporate",
      seasonId: seasonId,
      discountCourses: "15.00",
      discountMerch: "10.00",
      discountOther: "5.00",
      excludeOpen: true,
      excludeOtherPromos: true,
      validFrom: "2025-09-01",
      validTo: "2026-06-30",
      isActive: true,
      approvedBy: "Direzione",
    });

    // 5. Instructor Agreements
    await db.insert(instructorAgreements).values({
      memberId: 1, // Assumendo che esista il member 1
      seasonId: seasonId,
      agreementType: "flat_monthly",
      baseMonthlyAmount: "1000.00",
      paymentMode: "bonifico",
      isActive: true,
      notes: `Accordo Fisso Mensile - Maestro ${i}`,
    });
  }

  console.log("Seeding completed successfully.");
}

seed().catch(console.error).finally(() => process.exit(0));
