import * as fs from "fs";
import * as dotenv from "dotenv";

const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

async function run() {
    const { db } = await import("./server/db");
    const { sql } = await import("drizzle-orm");

    try {
        console.log("--- ULTIMI RECORD ---");
        const res1 = await db.execute(sql`SELECT id, name, description, created_at FROM booking_services ORDER BY created_at DESC LIMIT 10;`);
        console.log(res1[0] || res1);

        console.log("\n--- TOTALE RECORD ---");
        const res2 = await db.execute(sql`SELECT COUNT(*) as totale FROM booking_services;`);
        console.log(res2[0] || res2);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
