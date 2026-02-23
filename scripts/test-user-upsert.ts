
import { storage } from "../server/storage";

async function testUpsert() {
    console.log("Testing upsertUser...");
    try {
        const user = await storage.upsertUser({
            id: "test-admin-id",
            email: "test@example.com",
            firstName: "Test",
            lastName: "Admin",
            profileImageUrl: ""
        });
        console.log("✅ User upserted:", user);
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to upsert user:", err);
        process.exit(1);
    }
}

testUpsert();
