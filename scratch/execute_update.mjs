import mysql from 'mysql2/promise';
import fs from 'fs';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const courseIds = [632, 641, 823, 824, 825, 826, 827];

  // PASSO 2 - BACKUP
  console.log('--- PASSO 2: BACKUP DEI 7 RECORD ---');
  const [backupCourses] = await pool.query(`SELECT * FROM courses WHERE id IN (?)`, [courseIds]);
  
  if (backupCourses.length === 0) {
    console.log("No records to backup.");
    pool.end();
    return;
  }

  let sqlDump = '-- BACKUP PRE-UPDATE F1-008\\n';
  for (const row of backupCourses) {
    const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
    const values = Object.values(row).map(v => {
      if (v === null) return 'NULL';
      if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
      if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
      return v;
    }).join(', ');
    sqlDump += `REPLACE INTO courses (${keys}) VALUES (${values});\\n`;
  }
  fs.writeFileSync('/Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1008_PRE_BONIFICA_20260429.sql', sqlDump);
  console.log('Backup scritto in /Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1008_PRE_BONIFICA_20260429.sql');

  // PASSO 3 - UPDATE CHIRURGICO
  console.log('\\n--- PASSO 3: UPDATE CHIRURGICO ---');
  const [updateResult] = await pool.query(`UPDATE courses SET season_id = 1 WHERE id IN (?)`, [courseIds]);
  console.log(`Update Result Affected Rows: ${updateResult.affectedRows}`);
  
  // PASSO 4 - VERIFICA POST-UPDATE
  console.log('\\n--- PASSO 4: VERIFICA POST-UPDATE ---');
  const [countAllCourses] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type = 'course'`);
  const [count2526Active] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id = 1 AND active = 1 AND activity_type = 'course'`);
  const [count2627Active] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id = 2 AND active = 1 AND activity_type = 'course'`);
  const [countNulls] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id IS NULL AND activity_type = 'course'`);
  const [countOutside] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id NOT IN (1, 2) AND active = 1 AND activity_type = 'course'`);
  
  console.log(`Totale courses (activity_type='course'): ${countAllCourses[0].count}`);
  console.log(`Corsi 25-26 attivi (season_id=1): ${count2526Active[0].count}`);
  console.log(`Corsi 26-27 attivi (season_id=2): ${count2627Active[0].count}`);
  console.log(`Corsi con season_id NULL residui: ${countNulls[0].count}`);
  console.log(`Corsi attivi fuori stagione 1 e 2: ${countOutside[0].count}`);

  pool.end();
}

runQueries().catch(console.error);
