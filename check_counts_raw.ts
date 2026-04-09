import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection("mysql://gaetano_admin:StarGem2026!Secure@127.0.0.1:3307/stargem_v2");
  
  const tables = [
    "ws_attendances", "ws_cats", "rec_cats", "sun_cats", 
    "vac_cats", "ca_cats", "workshops", "free_trials", 
    "paid_trials", "single_lessons", "campus_activities", 
    "vacation_studies", "courses"
  ];
  
  let valid = true;
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`Table ${table} count: ${(rows as any[])[0].count}`);
    } catch (e: any) {
      console.log(`Table ${table} error: ${e.message}`);
    }
  }

  await connection.end();
}

main().catch(console.error);
