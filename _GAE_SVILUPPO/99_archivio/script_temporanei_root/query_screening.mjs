import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    uri: 'mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2'
  });

  const querySafe = async (q, params=[]) => {
    try {
      const [rows] = await connection.query(q, params);
      return rows;
    } catch(e) {
      return [{error: e.message}];
    }
  };

  console.log("=== PARTE 1: INVENTARIO ===");
  const tables = await querySafe(`
    SELECT 
      table_name AS 'Table',
      table_rows AS 'Rows',
      (data_length + index_length) / 1024 / 1024 AS 'Size_MB',
      update_time AS 'Updated',
      engine AS 'Engine'
    FROM information_schema.tables
    WHERE table_schema = 'stargem_v2'
    ORDER BY table_rows DESC;
  `);
  
  for(let t of tables) {
    if(t.Table) {
        const cols = await querySafe(`SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema='stargem_v2' AND table_name=?`, [t.Table]);
        t.Columns = cols[0].c;
    }
  }
  console.log(JSON.stringify(tables, null, 2));

  console.log("\n=== PARTE 6A: Conta su courses ===");
  console.log("activity_type group:", await querySafe(`SELECT activity_type, COUNT(*) as c FROM courses GROUP BY 1`));
  console.log("activity_type IS NULL:", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type IS NULL`));
  console.log("active=1:", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE active=1`));

  console.log("\n=== PARTE 6B: Conta workshop ===");
  console.log("B1 activity_type='workshop':", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type='workshop'`));
  console.log("B2 sku LIKE 'WS%':", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE sku LIKE 'WS%' OR sku LIKE '%WS_%'`));
  // Find category_id for workshop
  const categories = await querySafe(`SELECT * FROM custom_list_items WHERE value LIKE '%workshop%' OR name LIKE '%workshop%' OR internal_name LIKE '%workshop%'`);
  console.log("Categories found:", categories);
  if (categories.length > 0) {
    const catIds = categories.map(c => c.id).join(',');
    console.log(`B3 JOIN categories IN (${catIds}):`, await querySafe(`SELECT COUNT(*) as c FROM courses WHERE category_id IN (${catIds})`));
  }
  console.log("B4 type='workshop' OR sku LIKE 'WS%':", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type='workshop' OR sku LIKE 'WS%'`));

  console.log("\n=== PARTE 6C: Conta corsi ===");
  console.log("C1 activity_type='course':", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type='course'`));
  console.log("C2 activity_type='corso':", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type='corso'`));
  console.log("C3 IN ('course','corso'):", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type IN ('course','corso')`));
  console.log("C4 IS NULL:", await querySafe(`SELECT COUNT(*) as c FROM courses WHERE activity_type IS NULL`));

  console.log("\n=== PARTE 6E: Verifica scheda WS Urban Coreografico ===");
  const urban = await querySafe(`SELECT id, sku, name, activity_type, category_id, active FROM courses WHERE sku = '2526AMBER-ALDRIN15MA'`);
  console.log("Urban course:", urban);
  if (urban.length > 0 && urban[0].id) {
    console.log("Enrollments for this course:", await querySafe(`SELECT COUNT(*) as c FROM enrollments WHERE course_id = ?`, [urban[0].id]));
  }

  await connection.end();
}
run().catch(console.error);
