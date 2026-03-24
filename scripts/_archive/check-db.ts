
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking DB connection...");
    try {
        const [rows] = await db.execute(sql`SELECT VERSION() as v`);
        console.log("Connected! Version:", (rows as any)[0].v);

        // Check member count
        const [count] = await db.execute(sql`SELECT COUNT(*) as c FROM members`);
        console.log("Member count:", (count as any)[0].c);

        process.exit(0);
    } catch (e) {
        console.error("Connection failed:", e);
        process.exit(1);
    }
}

main();
