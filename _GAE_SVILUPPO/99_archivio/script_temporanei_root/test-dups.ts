import * as dotenv from 'dotenv';
import { db } from './server/db';
import { DatabaseStorage } from './server/storage';

dotenv.config();

async function run() {
  const storage = new DatabaseStorage();
  console.log("Fetching duplicates...");
  const dups = await storage.getDuplicateFiscalCodes();
  console.log(`Totale coppie: ${dups.length}`);
  
  if (dups.length > 0) {
    console.log("Samples:");
    for (let i = 0; i < Math.min(3, dups.length); i++) {
       console.log(JSON.stringify(dups[i], null, 2));
    }
    
    // Check specific people
    const hasAbagnara = dups.some(d => d.name1.toLowerCase().includes('abagnara') || d.name2.toLowerCase().includes('abagnara'));
    const hasSartor = dups.some(d => d.name1.toLowerCase().includes('sartor') || d.name2.toLowerCase().includes('sartor'));
    console.log(`ABAGNARA appare: ${hasAbagnara}`);
    console.log(`SARTOR appare: ${hasSartor}`);
  }
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
