import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [tables] = await connection.execute("SHOW TABLES;");
  const dbTables = tables.map(tRow => Object.values(tRow)[0]);

  const schemaContent = fs.readFileSync('shared/schema.ts', 'utf-8');
  
  console.log("=== TABELLE ORFANE NEL DB (NON IN SCHEMA.TS) ===");
  for (const t of dbTables) {
    if (t === '__drizzle_migrations') continue;
    // Basic heuristic: check if table name appears in schema.ts
    // Drizzle tables are defined like: export const users = pgTable('users', ...)
    // So we search for the string: 't' or "t"
    const inSchema = schemaContent.includes(`'${t}'`) || schemaContent.includes(`"${t}"`);
    if (!inSchema) {
      const [countRes] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${t}\``);
      console.log(`- ${t} (${countRes[0].cnt} records)`);
    }
  }

  await connection.end();
}
main().catch(console.error);
