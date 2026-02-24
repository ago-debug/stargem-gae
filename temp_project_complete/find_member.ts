import { db } from "./server/db";
import { members } from "./shared/schema";
import { eq } from "drizzle-orm";

async function find() {
  const all = await db.select().from(members).where(eq(members.fiscalCode, "GNCGST70D25F205C"));
  console.log("MEMBER:", all);
}

find().catch(console.error);
