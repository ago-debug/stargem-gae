const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute("SELECT id, name, system_name FROM custom_lists");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main().catch(console.error);
