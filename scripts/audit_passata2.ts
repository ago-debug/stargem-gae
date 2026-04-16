import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const sql = `
    SELECT
      COUNT(*) as totale,
      SUM(CASE WHEN address IS NULL THEN 1 ELSE 0 END) as senza_indirizzo,
      SUM(CASE WHEN date_of_birth IS NULL THEN 1 ELSE 0 END) as senza_nascita,
      SUM(CASE WHEN city IS NULL THEN 1 ELSE 0 END) as senza_citta,
      SUM(CASE WHEN province IS NULL THEN 1 ELSE 0 END) as senza_provincia
    FROM members
    WHERE participant_type NOT IN
      ('DIPENDENTE','INSEGNANTE','PERSONAL_TRAINER')
      OR participant_type IS NULL;
  `;
  
  console.log(`--- Executing Query ---`);
  const [rows] = await connection.query(sql);
  console.log(JSON.stringify(rows, null, 2));

  await connection.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
