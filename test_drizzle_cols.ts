import { getTableColumns } from "drizzle-orm";
import { users } from "./shared/schema";

const cols = getTableColumns(users);
const key = Object.keys(cols)[0];
const col = cols[key];

console.log("Column keys:", Object.keys(col));
console.log("DataType:", (col as any).dataType);
console.log("ColumnType:", (col as any).columnType);
console.log("SQL Type:", (col as any).getSQLType?.());
