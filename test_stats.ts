import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./shared/schema";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const poolConnection = mysql.createPool(url);
  const db = drizzle(poolConnection, { schema, mode: "default" });

  try {
    const res = await db.select().from(schema.payments).limit(1);
    console.log("Payments query success! Count: " + res.length);
  } catch (err: any) {
    console.error("Error querying payments:", err.message);
  } finally {
    poolConnection.end();
  }
}

run();
