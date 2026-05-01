import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

async function runQueries() {
  const qA = await pool.query(`SELECT COUNT(*) as count FROM courses;`);
  console.log('A) Tutti i record courses:', qA[0][0].count);

  const qB = await pool.query(`SELECT activity_type, COUNT(*) as count FROM courses GROUP BY activity_type;`);
  console.log('B) Per activity_type:');
  console.table(qB[0]);

  const qC = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course';`);
  console.log('C) Solo activity_type = course:', qC[0][0].count);

  const qD = await pool.query(`SELECT season_id, COUNT(*) as count FROM courses GROUP BY season_id;`);
  console.log('D) Per season_id:');
  console.table(qD[0]);

  const qE = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1;`);
  console.log('E) Solo course in stagione attiva (id=1):', qE[0][0].count);

  const qF = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1;`);
  console.log('F) Solo course attivi in stagione attiva:', qF[0][0].count);

  const qG = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND day_of_week IS NOT NULL;`);
  console.log('G) Solo course attivi con day_of_week:', qG[0][0].count);

  const qH = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND day_of_week IS NOT NULL AND start_time IS NOT NULL;`);
  console.log('H) Solo course attivi con day_of_week + start_time:', qH[0][0].count);

  const qI = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND day_of_week IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL;`);
  console.log('I) Solo course attivi con day_of_week + start_time + end_time:', qI[0][0].count);

  const qJ = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND day_of_week IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND category_id IS NOT NULL;`);
  console.log('J) Solo course attivi con TUTTI i campi base + categoria:', qJ[0][0].count);

  const qK = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND instructor_id IS NOT NULL;`);
  console.log('K) Solo course attivi con instructor:', qK[0][0].count);

  const qL = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND (start_date IS NULL OR start_date <= '2026-04-29') AND (end_date IS NULL OR end_date >= '2026-04-29');`);
  console.log('L) Course con start_date / end_date validi rispetto a oggi:', qL[0][0].count);

  const qM = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND (start_date IS NULL OR start_date <= '2026-05-03') AND (end_date IS NULL OR end_date >= '2026-04-27');`);
  console.log('M) Course nel range settimana corrente (27apr-3mag):', qM[0][0].count);

  console.log('--- DOMANDA 4: RECORD SPORCHI ---');

  const q4A = await pool.query(`SELECT id, sku, name FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND category_id IS NULL LIMIT 5;`);
  const q4A_count = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND category_id IS NULL;`);
  console.log('4A) Senza categoria. Count:', q4A_count[0][0].count);
  console.table(q4A[0]);

  const q4B = await pool.query(`SELECT id, sku, name FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND instructor_id IS NULL LIMIT 5;`);
  const q4B_count = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND instructor_id IS NULL;`);
  console.log('4B) Senza insegnante. Count:', q4B_count[0][0].count);
  console.table(q4B[0]);

  const q4C = await pool.query(`SELECT id, sku, name, day_of_week, start_time FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND (day_of_week IS NULL OR start_time IS NULL) LIMIT 5;`);
  const q4C_count = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active=1 AND (day_of_week IS NULL OR start_time IS NULL);`);
  console.log('4C) Senza giorno o orario. Count:', q4C_count[0][0].count);
  console.table(q4C[0]);

  const q4D = await pool.query(`SELECT sku, COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 GROUP BY sku HAVING COUNT(*) > 1 LIMIT 5;`);
  const q4D_count = await pool.query(`SELECT COUNT(*) as count FROM (SELECT sku FROM courses WHERE activity_type='course' AND season_id=1 GROUP BY sku HAVING COUNT(*) > 1) as t;`);
  console.log('4D) SKU duplicati. Count:', q4D_count[0][0].count);
  console.table(q4D[0]);

  const q4E = await pool.query(`SELECT id, sku, name FROM courses WHERE activity_type='course' AND season_id=1 AND active IS NULL LIMIT 5;`);
  const q4E_count = await pool.query(`SELECT COUNT(*) as count FROM courses WHERE activity_type='course' AND season_id=1 AND active IS NULL;`);
  console.log('4E) Active=NULL. Count:', q4E_count[0][0].count);
  console.table(q4E[0]);

  pool.end();
}

runQueries().catch(console.error);
