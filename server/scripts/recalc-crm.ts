import { recalculateAllActiveMembers } from "../utils/crm-profiling";

async function run() {
  console.log("Starting mass CRM recalculation...");
  try {
    const total = await recalculateAllActiveMembers();
    console.log(`Successfully recalculated ${total} members.`);
    process.exit(0);
  } catch (error) {
    console.error("Error during calculation:", error);
    process.exit(1);
  }
}

run();
