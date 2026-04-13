import mysql from 'mysql2/promise';

async function audit() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
  });

  const queryStrings = [
    { name: '1. Stato tabella users', sql: "DESCRIBE users;" },
    { name: '1. Stato tabella members', sql: "DESCRIBE members;" },
    { name: '2. Verifica tabelle staff_ e payslips e member_forms_submissions', sql: `SHOW TABLES WHERE Tables_in_stargem_v2 LIKE 'staff_%' OR Tables_in_stargem_v2 = 'payslips' OR Tables_in_stargem_v2 = 'member_forms_submissions';`},
    { name: '3. Conta insegnanti esistenti', sql: `SELECT participant_type, COUNT(*) as tot FROM members WHERE participant_type IN ('INSEGNANTE', 'insegnante') GROUP BY participant_type;` },
    { name: '4. Campi GemStaff su members', sql: `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'stargem_v2' AND TABLE_NAME = 'members' AND COLUMN_NAME IN ('user_id','staff_status','lezioni_private_autorizzate','lezioni_private_autorizzate_at','lezioni_private_autorizzate_by','lezioni_private_note');` },
    { name: '5. Campi auth su users', sql: `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'stargem_v2' AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('email_verified','otp_token','otp_expires_at');` }
  ];

  for (const q of queryStrings) {
    console.log(`\n=== ${q.name} ===`);
    try {
      const [rows] = await connection.execute(q.sql);
      console.table(rows);
    } catch (e: any) {
      console.error(e.message);
    }
  }

  await connection.end();
}

audit();
