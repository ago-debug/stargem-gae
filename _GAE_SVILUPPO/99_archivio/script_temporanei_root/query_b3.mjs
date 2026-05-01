import mysql from 'mysql2/promise';
async function run() {
  const connection = await mysql.createConnection({
    uri: 'mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2'
  });
  const [cols] = await connection.query(`SHOW COLUMNS FROM custom_list_items`);
  console.log("Columns:", cols.map(c=>c.Field));
  
  const [cats] = await connection.query(`SELECT id, list_id, item_label, item_value FROM custom_list_items WHERE item_label LIKE '%workshop%' OR item_value LIKE '%workshop%'`);
  console.log("Categories:", cats);
  if(cats.length > 0) {
    const ids = cats.map(c => c.id).join(',');
    const [courses] = await connection.query(`SELECT COUNT(*) as c FROM courses WHERE category_id IN (${ids})`);
    console.log("B3 count:", courses[0].c);
  }
  await connection.end();
}
run().catch(console.error);
