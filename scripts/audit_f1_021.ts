import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== STEP 1 - Duplicati Nome+Cognome+Telefono (no email, no cf) ===");
  const [q1] = await connection.query(`
    SELECT first_name, last_name, phone,
           COUNT(*) as n,
           GROUP_CONCAT(id ORDER BY id) as ids,
           MIN(id) as id_da_tenere
    FROM members
    WHERE phone IS NOT NULL AND phone != ''
      AND (email IS NULL OR email = '')
      AND (fiscal_code IS NULL OR fiscal_code = '')
      AND active != 0
      AND (participant_type NOT IN
        ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
        OR participant_type IS NULL)
    GROUP BY first_name, last_name, phone
    HAVING COUNT(*) > 1
    ORDER BY n DESC
    LIMIT 30;
  `);
  console.log(JSON.stringify(q1, null, 2));

  console.log("\n=== STEP 2 - Totale ===");
  const [q2] = await connection.query(`
    SELECT COUNT(*) as gruppi,
           SUM(n) - COUNT(*) as records_extra
    FROM (
      SELECT first_name, last_name, phone,
             COUNT(*) as n
      FROM members
      WHERE phone IS NOT NULL AND phone != ''
        AND (email IS NULL OR email = '')
        AND (fiscal_code IS NULL OR fiscal_code = '')
        AND active != 0
        AND (participant_type NOT IN
          ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
          OR participant_type IS NULL)
      GROUP BY first_name, last_name, phone
      HAVING COUNT(*) > 1
    ) t;
  `);
  console.log(JSON.stringify(q2, null, 2));


  await connection.end();
}

run().catch(console.error);
