import { db } from "./server/db";
import { memberships, payments, members } from "./shared/schema";
import { eq, like } from "drizzle-orm";

async function main() {
  console.log("Looking for ABATE ANNA...");
  const memberRecords = await db.select().from(members).where(like(members.lastName, "%ABATE%"));
  const anna = memberRecords.find(m => m.firstName === "ANNA" && m.lastName === "ABATE");
  
  if (!anna) {
    console.log("ABATE ANNA not found");
    return;
  }
  
  console.log("Found member:", anna.id, anna.firstName, anna.lastName);
  
  const membershipRecords = await db.select().from(memberships).where(eq(memberships.memberId, anna.id));
  console.log("Memberships:", membershipRecords);
  
  const paymentRecords = await db.select().from(payments).where(eq(payments.memberId, anna.id));
  console.log("Payments:", paymentRecords);
  
  process.exit(0);
}

main().catch(console.error);
