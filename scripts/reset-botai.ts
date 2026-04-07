import "dotenv/config";
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
const scryptAsync = promisify(scrypt);
async function run() {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync("Palermo_1", salt, 64)) as Buffer;
  const password = `${buf.toString("hex")}.${salt}`;
  await db.update(users).set({ password }).where(eq(users.username, "botAI"));
  console.log("Password reset to Palermo_1");
  process.exit(0);
}
run();
