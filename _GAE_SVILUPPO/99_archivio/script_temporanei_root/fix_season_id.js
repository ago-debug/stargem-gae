import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [seasons] = await connection.execute(`SELECT id, name, is_active FROM seasons WHERE is_active = 1`);
  if (seasons.length > 0) {
      const activeSeasonId = seasons[0].id;
      console.log(`Active season found: ${seasons[0].name} (ID: ${activeSeasonId})`);
      
      const [result] = await connection.execute(`UPDATE enrollments SET season_id = ? WHERE season_id IS NULL`, [activeSeasonId]);
      console.log(`Updated ${result.affectedRows} enrollments with season_id = ${activeSeasonId}`);
  } else {
      console.log("No active season found!");
  }
  
  await connection.end();
}
main().catch(console.error);
