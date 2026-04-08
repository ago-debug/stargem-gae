const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute("SELECT id, name, system_name, list_type FROM custom_lists WHERE name LIKE '%Genere%' OR name LIKE '%Categor%'");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main().catch(console.error);
