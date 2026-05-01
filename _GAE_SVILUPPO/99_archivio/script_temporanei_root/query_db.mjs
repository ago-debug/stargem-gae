import { db, pool } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("=== PUNTO 3: Indexes on courses ===");
  const [indexes] = await pool.query('SHOW INDEX FROM courses');
  console.log(indexes.map(i => i.Key_name + ' (' + i.Column_name + ')').join(', '));

  console.log("\n=== PUNTO 4: participation_type ===");
  const [enrollments] = await pool.query('SELECT participation_type, COUNT(*) as count FROM enrollments GROUP BY participation_type ORDER BY count DESC');
  console.log(enrollments);

  console.log("\n=== PUNTO 6: activity_type ===");
  const [courses] = await pool.query('SELECT activity_type, COUNT(*) as count FROM courses GROUP BY activity_type ORDER BY count DESC');
  console.log(courses);

  console.log("\n=== PUNTO 6: allenamento check ===");
  const [allenamenti] = await pool.query("SELECT COUNT(*) as count FROM courses WHERE sku LIKE '2526ALLENAMENTO%' OR activity_type = 'allenamenti'");
  console.log(allenamenti);
  
  console.log("\n=== PUNTO 6: storico check ===");
  const [storico] = await pool.query("SELECT COUNT(*) as count FROM courses WHERE activity_type = 'storico'");
  console.log(storico);

  process.exit(0);
}
run();
