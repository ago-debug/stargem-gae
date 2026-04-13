import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
    multipleStatements: true
  });

  console.log("=== FASE B: TRIGGER DB ===");
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deprecation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        operation VARCHAR(20) NOT NULL,
        triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note TEXT NULL
      );
    `);
    console.log("Tabella deprecation_logs creata o già esistente.");

    // Drizzle/mysql2 execute requires triggers to be syntactically whole
    await connection.execute(`
      CREATE TRIGGER IF NOT EXISTS warn_instructors_insert
      BEFORE INSERT ON members
      FOR EACH ROW
      BEGIN
        IF NEW.participant_type = 'INSEGNANTE' THEN
          INSERT INTO deprecation_logs
            (table_name, operation, note)
          VALUES
            ('members/instructors', 'INSERT',
             'Nuovo insegnante via members — OK');
        END IF;
      END;
    `);
    console.log("Trigger warn_instructors_insert (IF NOT EXISTS) eseguito.");
  } catch (error: any) {
    console.error("Errore DB:", error.message);
  }

  await connection.end();
}

run().catch(console.error);
