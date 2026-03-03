import { storage } from "../server/storage";

async function testFetch() {
    try {
        console.log("Fetching workshops via storage...");
        const workshops = await storage.getWorkshops();
        console.log(`Successfully fetched ${workshops.length} workshops.`);
        if (workshops.length > 0) {
            console.log("First workshop:", JSON.stringify(workshops[0], null, 2));
        }
    } catch (error) {
        console.error("Storage fetch failed:", error);
    } finally {
        process.exit(0);
    }
}

testFetch();
