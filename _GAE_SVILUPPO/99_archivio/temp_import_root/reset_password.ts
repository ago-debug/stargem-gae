import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function run() {
  const newPassword = "Ducati1015_";
  const hashed = await hashPassword(newPassword);
  
  // Update admin user
  const result = await db.update(users)
    .set({ password: hashed })
    .where(eq(users.username, "admin"));
    
  console.log("Password updated for admin. Rows affected:", result[0].affectedRows);
  process.exit(0);
}

run().catch(console.error);
