import "dotenv/config";
import { storage } from "../server/storage";
import { comparePasswords } from "../server/auth";

async function main() {
  const user = await storage.getUserByUsername("admin");
  if (!user) {
    console.log("Admin user not found in DB");
    return;
  }
  console.log("Found user:", user.username, "Password hash prefix:", user.password.substring(0, 10));
  const isMatch = await comparePasswords("admin", user.password);
  console.log("Password match for 'admin':", isMatch);
}
main().catch(console.error).finally(() => process.exit(0));
