import { db } from "./db";
import { provinces, cities } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ComuneData {
  nome: string;
  sigla: string;
  cap: string[];
  codiceCatastale: string;
}

async function seedAllComuni() {
  console.log("Fetching all Italian comuni from GitHub...");
  
  const response = await fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json");
  const comuni: ComuneData[] = await response.json();
  
  console.log(`Found ${comuni.length} comuni`);

  const existingProvinces = await db.select().from(provinces);
  const provinceMap = new Map<string, number>();
  existingProvinces.forEach(p => {
    provinceMap.set(p.code, p.id);
  });
  
  console.log(`Found ${existingProvinces.length} provinces in database`);

  console.log("Deleting existing cities...");
  await db.delete(cities);

  let inserted = 0;
  let skipped = 0;
  const batchSize = 100;
  let batch: { name: string; provinceId: number; postalCode: string | null; istatCode: string | null }[] = [];

  for (const comune of comuni) {
    const provinceId = provinceMap.get(comune.sigla);
    
    if (!provinceId) {
      skipped++;
      continue;
    }

    const postalCode = comune.cap && comune.cap.length > 0 ? comune.cap[0] : null;

    batch.push({
      name: comune.nome,
      provinceId,
      postalCode,
      istatCode: comune.codiceCatastale || null,
    });

    if (batch.length >= batchSize) {
      await db.insert(cities).values(batch);
      inserted += batch.length;
      batch = [];
      
      if (inserted % 500 === 0) {
        console.log(`  Inserted ${inserted} comuni...`);
      }
    }
  }

  if (batch.length > 0) {
    await db.insert(cities).values(batch);
    inserted += batch.length;
  }

  console.log("\n=== Import Complete ===");
  console.log(`Inserted: ${inserted} comuni`);
  console.log(`Skipped: ${skipped} (province not found)`);
}

seedAllComuni()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
