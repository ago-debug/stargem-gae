const { drizzle } = require("drizzle-orm/mysql2");
const mysql = require("mysql2/promise");

async function run() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL || "mysql://gaetano:gaetano2025@localhost:3306/cm_stargem" // Fallback if no .env
  });
  const [rows] = await connection.query("SELECT * FROM user_roles");
  console.log(JSON.stringify(rows, null, 2));
  connection.end();
}
run();
