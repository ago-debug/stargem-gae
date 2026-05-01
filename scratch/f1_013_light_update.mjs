import mysql from 'mysql2/promise';
import fs from 'fs';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runUpdate() {
  const connection = await pool.getConnection();
  try {
    console.log("1. Generating backup...");
    const [allCourses] = await connection.query('SELECT * FROM courses');
    
    // Create simple INSERT statements for backup
    let sqlDump = '-- BACKUP TABLE courses prima dell UPDATE F1-013-LIGHT\\n';
    for (const c of allCourses) {
      const keys = Object.keys(c);
      const values = Object.values(c).map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
        return v;
      });
      sqlDump += `INSERT INTO courses (\`${keys.join('`, `')}\`) VALUES (${values.join(', ')});\\n`;
    }
    
    fs.writeFileSync('/Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1013LIGHT_PRE_UPDATE_DT_20260429.sql', sqlDump);
    console.log("Backup written.");

    console.log("2. Executing UPDATE in transaction...");
    await connection.beginTransaction();
    await connection.query(`UPDATE courses SET activity_type = 'visita_medica' WHERE id IN (551, 554)`);
    await connection.commit();
    console.log("UPDATE committed.");

    console.log("3. Post-verification...");
    const [courses] = await connection.query(`SELECT id, sku, name, activity_type FROM courses WHERE id IN (551, 554)`);
    console.table(courses);

    const [lezioniIndiv] = await connection.query(`
      SELECT COUNT(*) as count FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.activity_type = 'lezione_individuale'
    `);
    console.log("Enrollments lezione_individuale:", lezioniIndiv[0].count);

    const [visitaMedica] = await connection.query(`
      SELECT COUNT(*) as count FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.activity_type = 'visita_medica'
    `);
    console.log("Enrollments visita_medica:", visitaMedica[0].count);

  } catch (error) {
    await connection.rollback();
    console.error("Error occurred, rolled back.", error);
  } finally {
    connection.release();
    pool.end();
  }
}

runUpdate().catch(console.error);
