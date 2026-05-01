import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const [types] = await pool.query(`SELECT DISTINCT activity_type FROM courses`);
  console.log('Activity types found in DB:', types.map(t => t.activity_type));

  const allTypes = [
    'course', 'workshop', 'domenica_movimento', 'lezione_individuale', 'prenotazioni',
    'allenamenti', 'campus', 'saggio', 'vacanza_studio', 'servizi', 'merchandising',
    'affitti', 'free_trial', 'paid_trial', 'buono_regalo', 'membership'
  ];

  console.log('--- DOMANDA 2 ---');
  for (const type of allTypes) {
    const [total] = await pool.query(`SELECT COUNT(*) as count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE c.activity_type=?`, [type]);
    const [seasonActive] = await pool.query(`SELECT COUNT(*) as count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE c.activity_type=? AND e.season_id=1`, [type]);
    const [coursesActive] = await pool.query(`SELECT COUNT(*) as count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE c.activity_type=? AND e.season_id=1 AND c.active=1`, [type]);
    const [statusActive] = await pool.query(`SELECT COUNT(*) as count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE c.activity_type=? AND (e.status='active' OR e.status IS NULL)`, [type]);

    console.log(`Type: ${type.padEnd(20)} | Total: ${total[0].count} | Season 1: ${seasonActive[0].count} | On Active Courses: ${coursesActive[0].count} | Status Active/Null: ${statusActive[0].count}`);
  }

  const [wsQuery] = await pool.query(`
    SELECT COUNT(*) as count FROM enrollments e 
    JOIN courses c ON c.id=e.course_id 
    WHERE c.activity_type='workshop' 
      AND (e.status='active' OR e.status IS NULL)
      AND c.active=1
  `);
  console.log('Workshop active enrollments on active courses:', wsQuery[0].count);

  const [liTotal] = await pool.query(`SELECT COUNT(*) as count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE c.activity_type IN ('lezione_individuale', 'prenotazioni')`);
  const [liSeason1] = await pool.query(`SELECT COUNT(*) as count FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE c.activity_type IN ('lezione_individuale', 'prenotazioni') AND e.season_id=1`);
  console.log('Lezioni Individuali Total:', liTotal[0].count);
  console.log('Lezioni Individuali Season 1:', liSeason1[0].count);

  pool.end();
}

runQueries().catch(console.error);
