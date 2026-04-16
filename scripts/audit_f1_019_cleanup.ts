import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== PROBLEMA 1: CF con errore ultima lettera ===");
  const [q1] = await connection.query(`
    SELECT m1.id as id_vecchio,
           m2.id as id_nuovo,
           m1.fiscal_code as cf1,
           m2.fiscal_code as cf2,
           m1.first_name, m1.last_name,
           m1.phone,
           m1.created_at as data1,
           m2.created_at as data2
    FROM members m1
    JOIN members m2
      ON m1.first_name = m2.first_name
      AND m1.last_name = m2.last_name
      AND m1.phone = m2.phone
      AND LEFT(m1.fiscal_code,15) = LEFT(m2.fiscal_code,15)
      AND m1.fiscal_code != m2.fiscal_code
      AND m1.id < m2.id
    WHERE m1.fiscal_code IS NOT NULL
      AND m2.fiscal_code IS NOT NULL
      AND LENGTH(m1.fiscal_code) = 16
      AND LENGTH(m2.fiscal_code) = 16;
  `);
  console.log(JSON.stringify(q1, null, 2));

  console.log("\n=== PROBLEMA 2: Stessa email, stesso CF ===");
  const [q2] = await connection.query(`
    SELECT email, fiscal_code, COUNT(*) as n,
      MIN(id) as id_da_tenere,
      GROUP_CONCAT(id ORDER BY id) as tutti_ids
    FROM members
    WHERE email IS NOT NULL AND email != ''
      AND fiscal_code IS NOT NULL
      AND (participant_type NOT IN
        ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
        OR participant_type IS NULL)
    GROUP BY email, fiscal_code
    HAVING COUNT(*) > 1
    ORDER BY n DESC
    LIMIT 20;
  `);
  console.log(JSON.stringify(q2, null, 2));

  console.log("\n=== PROBLEMA 3a: Cognome e Nome uniti (first_name con spazio) ===");
  const [q3a] = await connection.query(`
    SELECT id, first_name, last_name, fiscal_code
    FROM members
    WHERE first_name LIKE '% %'
      AND last_name NOT LIKE '% %'
      AND (participant_type IS NULL
        OR participant_type = 'SOCIO')
    LIMIT 20;
  `);
  console.log(JSON.stringify(q3a, null, 2));

  console.log("\n=== PROBLEMA 3b: Cognome e Nome uniti (last_name con spazio) ===");
  const [q3b] = await connection.query(`
    SELECT id, first_name, last_name
    FROM members
    WHERE last_name LIKE '% %'
    LIMIT 20;
  `);
  console.log(JSON.stringify(q3b, null, 2));

  await connection.end();
}

run().catch(console.error);
