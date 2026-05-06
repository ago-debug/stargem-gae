import { config } from "dotenv";
config();
import { db, pool } from "./server/db";
import * as schema from "./shared/schema";
import { getTableColumns } from "drizzle-orm";

async function main() {
    const tableName = "courses";
    const item = (schema as any)[tableName];
    
    if (item) {
        const cols = getTableColumns(item);
        const colNames = Object.keys(cols);
        
        const countQueries = colNames.map(c => `COUNT(\`${c}\`) as \`${c}\``).join(', ');
        const sqlQuery = `SELECT COUNT(*) as _total, ${countQueries} FROM ${tableName}`;
        
        console.log("Query:", sqlQuery);
        const [result]: any = await pool.query(sqlQuery);
        console.log(result[0]);
    }
    process.exit(0);
}
main();
