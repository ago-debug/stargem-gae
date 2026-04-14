import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const badPool = mysql.createPool({ uri: "mysql://nosuchuser:badpass@127.0.0.1:3307/stargem_v2" });
  const badDb = drizzle(badPool);
  try {
    await badDb.select().from(users).where(eq(users.username, "admin"));
  } catch (e) {
    console.log("DB connection error wrapped?", e.message.substring(0, 100));
  }
  process.exit(0);
}
run();
