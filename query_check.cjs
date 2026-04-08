const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [rows] = await connection.execute("SELECT id, name, system_name FROM custom_lists WHERE id IN (15, 21)");
  console.log("SELECT:");
  console.log(JSON.stringify(rows, null, 2));

  try {
    const [desc] = await connection.execute("DESCRIBE custom_list_items"); /* They called it custom_list_values but it's custom_list_items */
    console.log("DESCRIBE custom_list_items:");
    console.log(JSON.stringify(desc, null, 2));
  } catch(e) {}

  process.exit(0);
}
main().catch(console.error);
