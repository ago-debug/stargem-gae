import { db } from "./server/db";
import { storage } from "./server/storage";

async function main() {
  const members = await storage.getMembersWithEntityCards();
  const abate = members.find(m => m.lastName === 'ABATE');
  console.log("ABATE ANNA Entity Card Status:", JSON.stringify(abate, null, 2));
  process.exit(0);
}
main();
