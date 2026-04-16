import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== STEP 2 - Doppioni TIPO B (Nome + Cognome + Telefono) ===");
  const [q2] = await connection.query(`
    SELECT
      first_name, last_name, phone,
      COUNT(*) as n,
      GROUP_CONCAT(id ORDER BY id) as ids,
      GROUP_CONCAT(fiscal_code ORDER BY id) as cf_list,
      GROUP_CONCAT(from_where ORDER BY id) as origini
    FROM members
    WHERE phone IS NOT NULL AND phone != ''
      AND (participant_type NOT IN
        ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
        OR participant_type IS NULL)
    GROUP BY first_name, last_name, phone
    HAVING COUNT(*) > 1
    ORDER BY n DESC
    LIMIT 30;
  `);
  console.log(JSON.stringify(q2, null, 2));

  console.log("\n=== STEP 3 - Totale TIPO B ===");
  const [q3] = await connection.query(`
    SELECT COUNT(*) as gruppi_duplicati,
           SUM(n) - COUNT(*) as records_extra
    FROM (
      SELECT first_name, last_name, phone,
             COUNT(*) as n
      FROM members
      WHERE phone IS NOT NULL AND phone != ''
        AND (participant_type NOT IN
          ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
          OR participant_type IS NULL)
      GROUP BY first_name, last_name, phone
      HAVING COUNT(*) > 1
    ) t;
  `);
  console.log(JSON.stringify(q3, null, 2));

  console.log("\n=== STEP 4 - Doppioni per Email ===");
  const [q4] = await connection.query(`
    SELECT email, COUNT(*) as n,
      GROUP_CONCAT(id ORDER BY id) as ids,
      GROUP_CONCAT(first_name ORDER BY id) as nomi,
      GROUP_CONCAT(fiscal_code ORDER BY id) as cf_list
    FROM members
    WHERE email IS NOT NULL AND email != ''
      AND (participant_type NOT IN
        ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
        OR participant_type IS NULL)
    GROUP BY email
    HAVING COUNT(*) > 1
    ORDER BY n DESC
    LIMIT 20;
  `);
  console.log(JSON.stringify(q4, null, 2));

  await connection.end();
}

run().catch(console.error);
