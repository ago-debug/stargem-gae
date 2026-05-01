import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [list] = await connection.execute("SELECT id, name FROM custom_lists WHERE name = 'categorie' OR name = 'category'");
  if (list.length > 0) {
    const listId = list[0].id;
    const [items] = await connection.execute(`SELECT id, value FROM custom_list_items WHERE list_id = ${listId}`);
    console.log("Custom List Items:", items);
  } else {
    console.log("Custom list 'categorie' not found");
  }
  await connection.end();
}
main().catch(console.error);
