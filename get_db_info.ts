import { config } from "dotenv";
config();
import { db } from "./server/db";
import * as schema from "./shared/schema";
import { getTableColumns } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function main() {
    const results = [];
    for (const key in schema) {
        const item = (schema as any)[key];
        if (item && typeof item === 'object' && item.Symbol !== undefined) {
            continue; // Skip non-tables
        }
        if (item && typeof item === 'object') {
            try {
                const cols = getTableColumns(item);
                if (cols && Object.keys(cols).length > 0) {
                    const colNames = Object.keys(cols);
                    let rowCount = 0;
                    try {
                        const countResult = await db.select({ count: sql<number>`count(*)` }).from(item);
                        rowCount = Number(countResult[0]?.count || 0);
                    } catch (e) {
                        continue;
                    }
                    if (rowCount > 0) {
                        results.push({
                            table: key,
                            columnCount: colNames.length,
                            rowCount,
                            columns: colNames.map(c => ({
                                name: c,
                                type: (cols[c] as any).getSQLType?.() || (cols[c] as any).dataType || "unknown"
                            }))
                        });
                    }
                }
            } catch(e) {}
        }
    }
    
    // Format output
    for (const r of results) {
        console.log(`\n### Tabella: **${r.table}** (${r.rowCount} record, ${r.columnCount} colonne)`);
        for (const c of r.columns) {
            console.log(`- \`${c.name}\`: *${c.type}*`);
        }
    }
    process.exit(0);
}
main();
