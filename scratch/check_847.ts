import { config } from "dotenv";
config();
import { db } from "../server/db";
import { members } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const result = await db.select().from(members).where(eq(members.id, 847));
  console.log("Member 847 in DB:", result);
  process.exit(0);
}
run();
