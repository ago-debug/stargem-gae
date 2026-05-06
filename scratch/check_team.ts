import { config } from "dotenv";
config();
import { db } from "../server/db";
import { members, teamEmployees } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const result = await db.select().from(teamEmployees).leftJoin(members, eq(members.id, teamEmployees.memberId));
  console.log(`There are ${result.length} teamEmployees`);
  
  const m847 = await db.select().from(teamEmployees).where(eq(teamEmployees.memberId, 847));
  console.log("Member 847 in teamEmployees:", m847);
  process.exit(0);
}
run();
