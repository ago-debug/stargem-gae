const mysql = require("mysql2/promise");
require("dotenv").config();
async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute("SELECT id, username, password FROM users");
  console.log(JSON.stringify(rows.map(r => ({ username: r.username, isBotAI: r.username === 'botAI' })), null, 2));
  process.exit();
}
main().catch(console.error);
