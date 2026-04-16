import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  async function query(sql: string) {
    console.log(`\n\n--- Executing: ${sql} ---`);
    const [rows, fields] = await connection.query(sql);
    console.log(JSON.stringify(rows, null, 2));
  }

  // STEP 1
  await query('SELECT COUNT(*) as totale FROM members;');
  await query("SELECT COUNT(*) as con_email FROM members WHERE email IS NOT NULL AND email != '';");
  await query("SELECT COUNT(*) as con_cf FROM members WHERE fiscal_code IS NOT NULL AND fiscal_code != '';");
  await query("SELECT COUNT(*) as con_user_id FROM members WHERE user_id IS NOT NULL;");
  await query("SELECT participant_type, COUNT(*) as totale FROM members GROUP BY participant_type ORDER BY totale DESC;");
  await query("SELECT id, first_name, last_name, email, fiscal_code, participant_type, created_at FROM members ORDER BY created_at DESC LIMIT 5;");
  await query("SELECT MIN(created_at) as primo_inserimento, MAX(created_at) as ultimo_inserimento FROM members;");

  // import_configs
  await query("DESCRIBE import_configs;");

  await connection.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
