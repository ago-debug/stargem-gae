import { db } from "../server/db";
import * as schema from "../shared/schema";
import { isNotNull, eq } from "drizzle-orm";

async function run() {
  const membersWithUsers = await db.select({
      mId: schema.members.id,
      mFirst: schema.members.firstName,
      uId: schema.members.userId
  }).from(schema.members).where(isNotNull(schema.members.userId)).limit(5);
  console.log("Members with users:", membersWithUsers);
  
  const teamUsers = await db.select({
      mId: schema.teamEmployees.memberId,
      uId: schema.teamEmployees.userId
  }).from(schema.teamEmployees).where(isNotNull(schema.teamEmployees.userId)).limit(5);
  console.log("Team employees with users:", teamUsers);
  
  process.exit(0);
}
run();
