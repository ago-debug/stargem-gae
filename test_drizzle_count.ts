import { config } from "dotenv";
config();
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { getTableColumns, sql } from "drizzle-orm";

async function main() {
    const tableName = "courses";
    const item = (schema as any)[tableName];
    
    if (item) {
        const cols = getTableColumns(item);
        
        const countSelects: any = {
            total: sql<number>`count(*)`
        };
        for (const c of Object.keys(cols)) {
            countSelects[c] = sql<number>`count(${cols[c]})`;
        }
        
        const [result] = await db.select(countSelects).from(item);
        console.log(result);
    }
    process.exit(0);
}
main();
