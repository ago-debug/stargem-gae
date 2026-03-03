import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { todos } from "./shared/schema";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("No DATABASE_URL");
    return;
  }
  const poolConnection = mysql.createPool(url);
  const db = drizzle(poolConnection);

  try {
    const [cols] = await poolConnection.query("SHOW COLUMNS FROM todos");
    console.log("Columns:", cols);

    console.log("Attempting insertion...");
    const res = await db.insert(todos).values({
      text: "Test todo",
      createdBy: "Admin User",
      completed: false,
    });
    console.log("Insertion result:", res);
  } catch (err) {
    console.error("Error inserting:", err);
  } finally {
    poolConnection.end();
  }
}

run();
