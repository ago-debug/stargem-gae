import 'dotenv/config';
import { recalculateAllActiveMembers } from './server/utils/crm-profiling.js';

async function runBackfill() {
  console.log("Starting CRM backfill process...");
  try {
    const updated = await recalculateAllActiveMembers();
    console.log(`CRM Backfill completed. Updated ${updated} active members.`);
  } catch (err) {
    console.error("Error during backfill:", err);
  }
  process.exit(0);
}

runBackfill();
