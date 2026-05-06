import { config } from "dotenv";
config();
import { db } from "../server/db";
import { members } from "../shared/schema";
import * as fs from "fs";

async function run() {
  const data = JSON.parse(fs.readFileSync('./scratch/missing_members.json', 'utf8'));
  for (const row of data) {
    const toInsert: any = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === "") continue;
      if (value === "true") toInsert[key] = true;
      else if (value === "false") toInsert[key] = false;
      else if (['id', 'categoryId', 'subscriptionTypeId', 'internalId', 'athenaId', 'mastroC', 'mastroCol', 'codiceFe', 'crmProfileLevel', 'crmProfileScore'].includes(key)) {
        toInsert[key] = parseInt(value as string);
      } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('expiry') || key === 'createdAt' || key === 'updatedAt') {
        toInsert[key] = new Date(value as string);
      } else {
        toInsert[key] = value;
      }
    }
    
    // Clean complex metadata and photoUrl if it's too large
    delete toInsert.attachmentMetadata;
    delete toInsert.giftMetadata;
    delete toInsert.tessereMetadata;
    delete toInsert.certificatoMedicoMetadata;
    
    if (toInsert.photoUrl && toInsert.photoUrl.length > 60000) {
      console.log(`Skipping large photoUrl for ${toInsert.id}`);
      delete toInsert.photoUrl;
    }

    try {
      await db.insert(members).values(toInsert);
      console.log(`Inserted member ${toInsert.id} - ${toInsert.firstName} ${toInsert.lastName}`);
    } catch (e: any) {
      console.error(`Failed to insert ${toInsert.id}: ${e.message}`);
      if (e.code) console.error(`Error code: ${e.code}`);
    }
  }
  process.exit(0);
}
run();
