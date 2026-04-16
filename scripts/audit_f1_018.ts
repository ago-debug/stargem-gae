import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== STEP 1 - Doppioni certi ===");
  const [q1] = await connection.query(`
    SELECT fiscal_code,
           COUNT(*) as n_duplicati,
           GROUP_CONCAT(id ORDER BY id) as ids,
           GROUP_CONCAT(first_name ORDER BY id) as nomi,
           GROUP_CONCAT(last_name ORDER BY id) as cognomi,
           GROUP_CONCAT(created_at ORDER BY id) as date_creazione,
           GROUP_CONCAT(from_where ORDER BY id) as origini
    FROM members
    WHERE fiscal_code IS NOT NULL
      AND fiscal_code != ''
      AND participant_type NOT IN
        ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
      OR participant_type IS NULL
    GROUP BY fiscal_code
    HAVING COUNT(*) > 1
    ORDER BY n_duplicati DESC
    LIMIT 50;
  `);
  console.log(JSON.stringify(q1, null, 2));

  console.log("\n=== STEP 2 - Quanti doppioni totali ===");
  const [q2] = await connection.query(`
    SELECT COUNT(*) as cf_con_duplicati,
           SUM(n) - COUNT(*) as records_da_eliminare
    FROM (
      SELECT fiscal_code, COUNT(*) as n
      FROM members
      WHERE fiscal_code IS NOT NULL
        AND fiscal_code != ''
        AND participant_type NOT IN ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
      GROUP BY fiscal_code
      HAVING COUNT(*) > 1
    ) t;
  `);
  console.log(JSON.stringify(q2, null, 2));

  console.log("\n=== STEP 3 - Quanti members senza CF ===");
  const [q3] = await connection.query(`
    SELECT COUNT(*) as senza_cf
    FROM members
    WHERE fiscal_code IS NULL
      OR fiscal_code = ''
      OR LENGTH(fiscal_code) < 16;
  `);
  console.log(JSON.stringify(q3, null, 2));

  console.log("\n=== STEP 4 - Campione 5 doppioni ===");
  const [q4] = await connection.query(`
    SELECT m1.id as id1, m2.id as id2,
           m1.fiscal_code,
           m1.first_name, m1.last_name,
           m1.from_where as origine1,
           m2.from_where as origine2,
           m1.created_at as data1,
           m2.created_at as data2
    FROM members m1
    JOIN members m2
      ON m1.fiscal_code = m2.fiscal_code
      AND m1.id < m2.id
    WHERE m1.fiscal_code IS NOT NULL
    LIMIT 5;
  `);
  console.log(JSON.stringify(q4, null, 2));

  await connection.end();
}

run().catch(console.error);
