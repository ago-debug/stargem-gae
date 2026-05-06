import { config } from "dotenv";
config();
import { db } from "../server/db";
import { members } from "../shared/schema";
import * as fs from "fs";

async function run() {
  const data = JSON.parse(fs.readFileSync('./scratch/missing_members.json', 'utf8'));
  for (const row of data) {
    if (row.id !== "847") continue; // Test just ONE

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
    delete toInsert.photoUrl; 

    try {
      await db.insert(members).values(toInsert);
      console.log(`Successfully processed member ${toInsert.id}`);
    } catch (e: any) {
      console.log("FULL ERROR FOR", toInsert.id);
      console.log(e);
      if (e.cause) console.log("CAUSE:", e.cause);
    }
  }
  process.exit(0);
}
run();
