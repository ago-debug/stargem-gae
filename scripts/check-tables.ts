import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== TASK 1: Analysis ===");

    console.log("--- workshops ---");
    const wRes = await db.execute(sql`
      SELECT w.id, w.name FROM workshops w
      WHERE NOT EXISTS (
        SELECT 1 FROM courses c 
        WHERE c.name = w.name
      );
    `);
    console.log(JSON.stringify((wRes as any)?.[0] || wRes, null, 2));

    console.log("--- campus_activities ---");
    const caRes = await db.execute(sql`
      SELECT ca.id, ca.name FROM campus_activities ca
      WHERE NOT EXISTS (
        SELECT 1 FROM courses c 
        WHERE c.name = ca.name
      );
    `);
    console.log(JSON.stringify((caRes as any)?.[0] || caRes, null, 2));

    console.log("--- categories FK check ---");
    const catRes = await db.execute(sql`
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME = 'categories'
      AND TABLE_SCHEMA = DATABASE();
    `);
    console.log(JSON.stringify((catRes as any)?.[0] || catRes, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();
