import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  console.log("=== DOMANDA A: CONTEGGI DB ===");
  // 'lezione_individuale' activity_type is on `courses`. So let's query via JOIN
  const [total] = await pool.query(`
    SELECT COUNT(*) as count 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale'
  `);
  console.log(`Totale enrollments (activity_type='lezione_individuale'): ${total[0].count}`);
  
  const [totalSeason1] = await pool.query(`
    SELECT COUNT(*) as count 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale' AND c.season_id = 1
  `);
  console.log(`Totale enrollments (season_id=1): ${totalSeason1[0].count}`);

  const [totalActive] = await pool.query(`
    SELECT COUNT(*) as count 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale' AND e.status = 'active'
  `);
  console.log(`Totale enrollments (status='active'): ${totalActive[0].count}`);

  const [distinctMembers] = await pool.query(`
    SELECT COUNT(DISTINCT e.member_id) as count 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale'
  `);
  console.log(`Totale member distinti: ${distinctMembers[0].count}`);

  const [distinctCourses] = await pool.query(`
    SELECT COUNT(DISTINCT e.course_id) as count 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale'
  `);
  console.log(`Totale course distinti: ${distinctCourses[0].count}`);

  console.log("\\n=== DOMANDA B: RECORD ESEMPIO ===");
  const [course] = await pool.query(`SELECT id, name, sku FROM courses WHERE sku = '2526LEZINDIVIDUALE'`);
  console.log("Course 2526LEZINDIVIDUALE:", course[0]);

  const [records] = await pool.query(`
    SELECT e.id, e.member_id, e.course_id, e.status, e.enrollment_date 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale'
    LIMIT 5
  `);
  console.table(records);
  
  // Try to group by course_id to see if there are other courses
  const [courseGroups] = await pool.query(`
    SELECT c.id, c.name, c.sku, COUNT(*) as enrollments_count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.activity_type = 'lezione_individuale'
    GROUP BY c.id
  `);
  console.log("\\n=== Enrollments raggruppati per corso ===");
  console.table(courseGroups);
  
  // Let's check how the frontend gets lezioniIndividualiEnrollments
  // In server/routes.ts, /api/enrollments uses storage.getEnrollmentsBySeason(seasonId, activityType)
  // Let's see what storage.getEnrollmentsBySeason actually returns
  const [allEnr] = await pool.query(`
    SELECT COUNT(*) as count FROM enrollments WHERE participation_type='INDIVIDUAL_LESSON'
  `);
  console.log(`\\nEnrollments with participation_type='INDIVIDUAL_LESSON': ${allEnr[0].count}`);

  pool.end();
}

runQueries().catch(console.error);
