import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";

const run = async () => {
  const poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  poolConfig.password = "Verona2026stargem2026";
  const pool = mysql.createPool(poolConfig);
  const db = drizzle(pool);

  const [categories] = await pool.query("SELECT id, name FROM categories");
  const [customLists] = await pool.query("SELECT id FROM custom_lists WHERE system_name = 'categorie'");
  const listId = customLists[0].id;
  const [customItems] = await pool.query(`SELECT id, value FROM custom_list_items WHERE list_id = ${listId}`);

  console.log("Categories:", categories);
  console.log("CustomItems:", customItems);

  process.exit(0);
};
run();
