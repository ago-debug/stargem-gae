import { config } from "dotenv";
config();
import { db } from "./server/db";
import * as schema from "./shared/schema";

async function main() {
    const tableName = "courses";
    const item = (schema as any)[tableName];
    
    if (item) {
        const rows = await db.select().from(item).limit(5);
        console.log(rows);
    }
    process.exit(0);
}
main();
