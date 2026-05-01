import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function checkApiEquivalent() {
  const [courses] = await pool.query(`
    SELECT id, name, sku, active, season_id, activity_type 
    FROM courses 
    WHERE activity_type = 'lezione_individuale'
  `);
  console.table(courses);
  
  // See iscritti_per_attivita.tsx filter
  // const filteredData = Array.isArray(config?.data) ? (config.data as any[]).filter(activity => ...
  // Wait, is showOnlyWithEnrollments checked by default? Yes.
  
  pool.end();
}

checkApiEquivalent().catch(console.error);
