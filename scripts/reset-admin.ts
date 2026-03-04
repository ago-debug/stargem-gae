import "dotenv/config";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";
import { users } from "@shared/schema";
import { db } from "../server/db";
import { eq } from "drizzle-orm";

async function main() {
  const newHash = await hashPassword("admin");
  await db.update(users).set({ password: newHash }).where(eq(users.username, "admin"));
  console.log("Admin password reset to 'admin'");
}
main().catch(console.error).finally(() => process.exit(0));
