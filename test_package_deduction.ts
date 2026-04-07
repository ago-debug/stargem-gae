import { db } from "./server/db";
import { memberPackages } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    // 1. Prendi un pacchetto qualsiasi (o crealo se non c'è)
    let pkg = await db.query.memberPackages.findFirst();
    if (!pkg) {
      const [res] = await db.insert(memberPackages).values({
        memberId: 1,
        packageCode: "TEST-001",
        packageType: "SINGOLA",
        totalUses: 10,
        usedUses: 0,
        pricePaid: "50.00"
      });
      pkg = await db.query.memberPackages.findFirst({ where: eq(memberPackages.id, res.insertId) });
    }
    
    console.log(`Starting Uses: ${pkg?.usedUses} / ${pkg?.totalUses}`);

    // 2. Call the API to create an Allenamento and pass this package
    const payload = {
      name: "Allenamento con Pacchetto",
      lessonType: ["Cardio"],
      seasonId: 3, 
      dayOfWeek: "MER",
      startTime: "15:00",
      endTime: "16:00",
      statusTags: ["STATE:ATTIVO"],
      active: true,
      sku: "BOT-TEST-PKG",
      packageSingle: pkg?.id
    };

    const res = await fetch("http://localhost:5001/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("API Status:", res.status);
    
    // 3. Verify it was decremented
    const pkgAfter = await db.query.memberPackages.findFirst({ where: eq(memberPackages.id, pkg!.id) });
    console.log(`Ending Uses: ${pkgAfter?.usedUses} / ${pkgAfter?.totalUses}`);

    if (pkgAfter!.usedUses === pkg!.usedUses + 1) {
       console.log("✅ DEDUCTION WORKED!");
    } else {
       console.log("❌ DEDUCTION FAILED!");
    }

  } catch (err) {
    console.error("Test Error:", err);
  }
}

run().then(() => process.exit(0));
