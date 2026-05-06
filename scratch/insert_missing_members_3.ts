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
      if (value === "" || value === null) continue;
      if (value === "true") toInsert[key] = true;
      else if (value === "false") toInsert[key] = false;
      else if (key === 'createdAt' || key === 'updatedAt') {
        toInsert[key] = new Date(value as string);
      } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('expiry') || key === 'insertionDate') {
        if (!isNaN(Date.parse(value as string))) {
            toInsert[key] = new Date(value as string);
        }
      } else if (['id', 'categoryId', 'subscriptionTypeId', 'internalId', 'athenaId', 'mastroC', 'mastroCol', 'codiceFe', 'crmProfileLevel', 'crmProfileScore', 'height', 'weight'].includes(key)) {
        toInsert[key] = parseInt(value as string);
        if (isNaN(toInsert[key])) delete toInsert[key];
      } else {
        toInsert[key] = value;
      }
    }
    
    delete toInsert.attachmentMetadata;
    delete toInsert.giftMetadata;
    delete toInsert.tessereMetadata;
    delete toInsert.certificatoMedicoMetadata;
    delete toInsert.photoUrl; // JUST DELETE IT FOR EVERYONE

    try {
      await db.insert(members).values(toInsert);
      console.log(`Successfully processed member ${toInsert.id} - ${toInsert.firstName} ${toInsert.lastName}`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
         console.log(`Already exists: ${toInsert.id}`);
      } else {
         console.error(`Failed to insert ${toInsert.id}:`, e.message);
      }
    }
  }
  process.exit(0);
}
run();
