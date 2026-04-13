import mysql from 'mysql2/promise';

async function apply() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
    multipleStatements: true
  });

  console.log("=== FASE C: ALTER users ===");
  try {
    await connection.execute(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS otp_token VARCHAR(10) NULL,
        ADD COLUMN IF NOT EXISTS otp_expires_at DATETIME NULL;
    `);
    const [c] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'stargem_v2' AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('email_verified', 'otp_token', 'otp_expires_at');
    `);
    console.table(c);
  } catch (e: any) { console.error("Error in C:", e.message); }

  console.log("\n=== FASE D: ALTER members ===");
  try {
    await connection.execute(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS staff_status ENUM('attivo','inattivo','archivio') NOT NULL DEFAULT 'attivo',
        ADD COLUMN IF NOT EXISTS lezioni_private_autorizzate BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS lezioni_private_autorizzate_at DATETIME NULL,
        ADD COLUMN IF NOT EXISTS lezioni_private_autorizzate_by VARCHAR(100) NULL,
        ADD COLUMN IF NOT EXISTS lezioni_private_note TEXT NULL;
    `);
    await connection.execute(`
      UPDATE members SET staff_status = 'attivo' WHERE participant_type = 'INSEGNANTE';
    `);
    const [d] = await connection.execute(`SELECT COUNT(*) as insegnanti_attivi FROM members WHERE participant_type = 'INSEGNANTE' AND staff_status = 'attivo';`);
    console.table(d);
  } catch (e: any) { console.error("Error in D:", e.message); }

  console.log("\n=== FASE E: CREAZIONE TABELLE NUOVE ===");
  const queries = [
    `CREATE TABLE IF NOT EXISTS staff_contracts_compliance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      doc_type ENUM('diploma_tesserino','carta_identita','codice_fiscale','permesso_soggiorno','foto_id','video_promo') NOT NULL,
      doc_value TEXT NULL,
      has_doc BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at DATE NULL,
      notes TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      INDEX idx_member_doc (member_id, doc_type)
    );`,
    `CREATE TABLE IF NOT EXISTS staff_document_signatures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      doc_type ENUM('regolamento_staff','codice_disciplinare_staff') NOT NULL,
      doc_version VARCHAR(10) NOT NULL,
      signed_at DATETIME NOT NULL,
      signed_by VARCHAR(100) NOT NULL,
      method ENUM('manual','kiosk') NOT NULL DEFAULT 'manual',
      notes TEXT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE KEY uk_member_doc_ver (member_id, doc_type, doc_version)
    );`,
    `CREATE TABLE IF NOT EXISTS staff_disciplinary_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      event_type ENUM('richiamo_verbale','ammonizione_scritta','sospensione','interruzione_rapporto') NOT NULL,
      event_date DATE NOT NULL,
      description TEXT NOT NULL,
      staff_response TEXT NULL,
      staff_response_at DATE NULL,
      decision TEXT NULL,
      resolved_at DATE NULL,
      created_by VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS staff_presenze (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      course_id INT NULL,
      date DATE NOT NULL,
      hours DECIMAL(4,2) NOT NULL DEFAULT 1.00,
      source ENUM('auto','manual') NOT NULL DEFAULT 'auto',
      status ENUM('bozza','confermato') NOT NULL DEFAULT 'bozza',
      confirmed_by VARCHAR(100) NULL,
      confirmed_at DATETIME NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS staff_sostituzioni (
      id INT AUTO_INCREMENT PRIMARY KEY,
      absent_member_id INT NOT NULL,
      substitute_member_id INT NULL,
      course_id INT NULL,
      absence_date DATE NOT NULL,
      lesson_description VARCHAR(255) NULL,
      payment_to ENUM('assente','sostituto','nessuno') NOT NULL DEFAULT 'sostituto',
      amount_override DECIMAL(8,2) NULL,
      notes TEXT NULL,
      visto_segreteria BOOLEAN NOT NULL DEFAULT FALSE,
      visto_elisa BOOLEAN NOT NULL DEFAULT FALSE,
      created_by VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (absent_member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (substitute_member_id) REFERENCES members(id) ON DELETE SET NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS payslips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      month TINYINT NOT NULL,
      year SMALLINT NOT NULL,
      hours_taught DECIMAL(6,2) NOT NULL DEFAULT 0,
      rate DECIMAL(8,2) NULL,
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('bozza','confermato','pagato') NOT NULL DEFAULT 'bozza',
      notes TEXT NULL,
      confirmed_by VARCHAR(100) NULL,
      confirmed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE KEY uk_member_mese_anno (member_id, month, year)
    );`
  ];
  try {
    for (const q of queries) { await connection.query(q); }
    console.log("Creazione tabelle eseguita.");
  } catch(e: any) { console.error("Error in E:", e.message); }

  console.log("\n=== VERIFICA FINALE ===");
  try {
    const [t1] = await connection.execute("SHOW TABLES LIKE 'staff_%';");
    console.table(t1);
    const [t2] = await connection.execute("SHOW TABLES LIKE 'payslips';");
    console.table(t2);
    const [c2] = await connection.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'stargem_v2' AND TABLE_NAME = 'members' AND (COLUMN_NAME LIKE '%staff%' OR COLUMN_NAME LIKE '%lezioni%');`);
    console.table(c2);
  } catch(e: any) { console.error("Error in Final:", e.message); }

  await connection.end();
}

apply();
