
import 'dotenv/config'; // Load env vars first
import { storage } from "../server/storage";
import { db } from "../server/db";
import { workshopCategories } from "@shared/schema";

async function testQuery() {
    console.log("Testing query on workshopCategories...");
    try {
        const cats = await db.select().from(workshopCategories);
        console.log("✅ Success. Count:", cats.length);
        console.log(cats);
    } catch (err) {
        console.error("❌ Failed to query workshopCategories:", err);
    }
    process.exit(0);
}

testQuery();
