import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [courses] = await connection.execute("SELECT id, name, category_id FROM courses WHERE activity_type = 'course' LIMIT 5");
  console.log("Courses category_ids:", courses.map(c => c.category_id));
  
  const [list] = await connection.execute("SELECT id FROM custom_lists WHERE slug = 'categorie'");
  if (list.length > 0) {
    const listId = list[0].id;
    const [items] = await connection.execute(`SELECT id, value FROM custom_list_items WHERE list_id = ${listId}`);
    console.log("Custom List Items for categorie:", items);
  }
  await connection.end();
}
main().catch(console.error);
