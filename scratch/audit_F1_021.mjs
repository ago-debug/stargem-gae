import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  const queryAndLog = async (title, sql) => {
    console.log(`\n--- ${title} ---`);
    try {
      const [rows] = await connection.execute(sql);
      console.table(rows);
      return rows;
    } catch (e) {
      console.error(e.message);
    }
  };

  await queryAndLog("Q1: DESCRIBE courses", "DESCRIBE courses");
  await queryAndLog("Q1: DESCRIBE enrollments", "DESCRIBE enrollments");
  await queryAndLog("Q1: DESCRIBE members", "DESCRIBE members");
  await queryAndLog("Q1: DESCRIBE memberships", "DESCRIBE memberships");
  await queryAndLog("Q1: DESCRIBE medical_certificates", "DESCRIBE medical_certificates");
  await queryAndLog("Q1: DESCRIBE payments", "DESCRIBE payments");
  await queryAndLog("Q1: SHOW TABLES LIKE '%attend%'", "SHOW TABLES LIKE '%attend%'");

  await queryAndLog("Q2: Esempio reale Domenica", "SELECT c.*, s.name as season FROM courses c JOIN seasons s ON c.season_id=s.id WHERE c.sku LIKE '2526DOS%' LIMIT 1");
  await queryAndLog("Q3: Esempio reale LI", "SELECT * FROM courses WHERE sku='2526LEZINDIVIDUALE' LIMIT 1");
  await queryAndLog("Q4: Esempio reale Campus", "SELECT * FROM courses WHERE sku LIKE '2526CAMPUS%' LIMIT 1");

  // Per Q5 vedremo quali campi ha members dal primo describe, proviamo a chiamarli:
  await queryAndLog("Q5: Minorenni campi (test basato su parent_name)", "SELECT first_name, last_name, date_of_birth, parent_name, parent_phone FROM members WHERE TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 LIMIT 3");

  await connection.end();
}

run();
