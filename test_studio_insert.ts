import "dotenv/config";
import { db } from "./server/db";
import { studios } from "./shared/schema";
import { sql } from "drizzle-orm";

async function testInsert() {
    console.log("Testing insert into 'studios'...");
    try {
        const data = {
            name: "Studio Test",
            floor: "1",
            operatingHours: { start: "09:00", end: "21:00" },
            operatingDays: ["LUN", "MAR"],
            active: true,
        };

        console.log("Data to insert:", data);

        const [result] = await db.insert(studios).values(data as any);
        console.log("Insert result:", result);

        const insertId = (result as any).insertId;
        console.log("New studio ID:", insertId);

        process.exit(0);
    } catch (error: any) {
        console.error("❌ Insert failed:");
        console.error(error);
        process.exit(1);
    }
}

testInsert();
