import * as dotenv from "dotenv";
dotenv.config();
import { db } from "./server/db";
import { getUnifiedActivitiesPreview } from "./server/services/unifiedBridge";

async function run() {
    try {
        const events = await getUnifiedActivitiesPreview({} as any);
        console.log("Found Events:", events.length);
        console.log(JSON.stringify(events[0], null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
