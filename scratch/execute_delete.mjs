import mysql from 'mysql2/promise';
import fs from 'fs';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const courseIds = [846, 847, 848];

  // PASSO 2 - BACKUP
  console.log('--- PASSO 2: BACKUP DEI 3 RECORD (mysqldump non disponibile, uso script) ---');
  const [backupCourses] = await pool.query(`SELECT * FROM courses WHERE id IN (?)`, [courseIds]);
  
  if (backupCourses.length === 0) {
    console.log("No records to backup/delete.");
    pool.end();
    return;
  }

  let sqlDump = '-- BACKUP PRE-DELETE F1-010\n';
  for (const row of backupCourses) {
    const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
    const values = Object.values(row).map(v => {
      if (v === null) return 'NULL';
      if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
      if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
      return v;
    }).join(', ');
    sqlDump += `INSERT INTO courses (${keys}) VALUES (${values});\n`;
  }
  fs.writeFileSync('/Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1010_PRE_DELETE_20260429.sql', sqlDump);
  console.log('Backup scritto in /Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1010_PRE_DELETE_20260429.sql');

  // PASSO 3 - DELETE CHIRURGICO
  console.log('--- PASSO 3: DELETE CHIRURGICO ---');
  const [deleteResult] = await pool.query(`DELETE FROM courses WHERE id IN (?)`, [courseIds]);
  console.log(`Delete Result Affected Rows: ${deleteResult.affectedRows}`);
  
  const [checkDeleted] = await pool.query(`SELECT id FROM courses WHERE id IN (?)`, [courseIds]);
  console.log(`Verifica record rimasti (deve essere 0): ${checkDeleted.length}`);

  // PASSO 4 - VERIFICA POST-DELETE
  console.log('--- PASSO 4: VERIFICA POST-DELETE ---');
  const [countAll] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id = 2`);
  const [countActive] = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE season_id = 2 AND active = 1`);
  
  console.log(`Totale corsi season_id=2: ${countAll[0].count}`);
  console.log(`Totale corsi season_id=2 attivi: ${countActive[0].count}`);

  pool.end();
}

runQueries().catch(console.error);
