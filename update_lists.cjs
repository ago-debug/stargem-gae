const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  await connection.execute("UPDATE custom_lists SET name='Generi Corsi' WHERE id=15");
  await connection.execute("UPDATE custom_lists SET name='Generi Workshop' WHERE id=21");
  
  const [rows] = await connection.execute("SELECT id, name, system_name FROM custom_lists WHERE id IN (15, 21)");
  console.log("UPDATED:");
  console.log(JSON.stringify(rows, null, 2));

  try {
    const [desc] = await connection.execute("DESCRIBE custom_list_items");
    console.log("DESCRIBE custom_list_items:");
    console.log(JSON.stringify(desc, null, 2));
  } catch (err) {
    console.log(err.message);
  }

  process.exit(0);
}
main().catch(console.error);
