import * as schema from '../shared/schema';
import { getTableColumns } from 'drizzle-orm';

const results = [];
for (const key in schema) {
  const item = schema[key as keyof typeof schema];
  if (item && typeof item === 'object') {
    try {
      // getTableColumns works on drizzle tables
      const cols = getTableColumns(item as any);
      if (cols && Object.keys(cols).length > 0) {
        const colNames = Object.keys(cols);
        results.push({ 
          tableExportName: key, 
          // drizzle tables have a symbol or property for the actual db name, but we can just use the export name or extract it
          columnCount: colNames.length,
          columns: colNames
        });
      }
    } catch (e) {
      // Not a table
    }
  }
}

// Sort by column count descending
results.sort((a, b) => b.columnCount - a.columnCount);

console.log(JSON.stringify(results, null, 2));
