import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

const queries = [
  // LAYER 1
  `CREATE TABLE team_employees (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    member_id               INT NOT NULL,
    user_id                 VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    team                    ENUM('segreteria','ass_manutenzione',
                                'ufficio','amministrazione',
                                'comunicazione') NOT NULL,
    tariffa_oraria          DECIMAL(5,2) NULL,
    stipendio_fisso_mensile DECIMAL(8,2) NULL,
    data_assunzione         DATE NULL,
    attivo                  BOOLEAN NOT NULL DEFAULT TRUE,
    note_hr                 TEXT NULL,
    created_at              DATETIME DEFAULT NOW(),
    updated_at              DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_team (team),
    INDEX idx_attivo (attivo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_shift_templates (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    employee_id      INT NOT NULL,
    settimana_tipo   ENUM('A','B','C','D','E') NOT NULL,
    giorno_settimana TINYINT NOT NULL COMMENT '0=Lun, 6=Dom',
    ora_inizio       TIME NOT NULL,
    ora_fine         TIME NOT NULL,
    postazione       ENUM('RECEPTION','PRIMO','SECONDO','UFFICIO',
                          'AMM.ZIONE','PAUSA','RIPOSO','RIUNIONE',
                          'STUDIO_1','STUDIO_2','MALATTIA','PERMESSO') NOT NULL,
    note             TEXT NULL,
    created_at       DATETIME DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    INDEX idx_settimana (settimana_tipo, giorno_settimana)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_scheduled_shifts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    data        DATE NOT NULL,
    postazione  ENUM('RECEPTION','PRIMO','SECONDO','UFFICIO',
                    'AMM.ZIONE','PAUSA','RIPOSO','RIUNIONE',
                    'STUDIO_1','STUDIO_2','MALATTIA','PERMESSO') NOT NULL,
    ora_inizio  TIME NOT NULL,
    ora_fine    TIME NOT NULL,
    template_id INT NULL,
    note_admin  TEXT NULL,
    created_by  VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    created_at  DATETIME DEFAULT NOW(),
    updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES team_shift_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_data (data),
    INDEX idx_employee_data (employee_id, data)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  // LAYER 2
  `CREATE TABLE team_activity_types (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    team       ENUM('segreteria','ass_manutenzione','tutti') NOT NULL DEFAULT 'tutti',
    label      VARCHAR(200) NOT NULL,
    categoria  VARCHAR(50) NULL,
    attivo     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_shift_diary_entries (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    employee_id      INT NOT NULL,
    shift_id         INT NULL,
    data             DATE NOT NULL,
    ora_slot         TIME NOT NULL,
    postazione       ENUM('RECEPTION','PRIMO','SECONDO','UFFICIO',
                          'AMM.ZIONE','PAUSA','RIPOSO','RIUNIONE',
                          'STUDIO_1','STUDIO_2','MALATTIA','PERMESSO') NOT NULL,
    activity_type_id INT NULL,
    attivita_libera  VARCHAR(300) NULL,
    quantita         INT NULL,
    minuti           SMALLINT NULL,
    note             TEXT NULL,
    ok_flag          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       DATETIME DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES team_scheduled_shifts(id) ON DELETE SET NULL,
    FOREIGN KEY (activity_type_id) REFERENCES team_activity_types(id) ON DELETE SET NULL,
    INDEX idx_employee_data (employee_id, data)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  // LAYER 3
  `CREATE TABLE team_attendance_logs (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    employee_id       INT NOT NULL,
    data              DATE NOT NULL,
    ore_lavorate      DECIMAL(4,2) NULL,
    tipo_assenza      ENUM('FE','PE','ML','F','AI','AG','MT','IN') NULL,
    check_in          DATETIME NULL,
    check_out         DATETIME NULL,
    note              TEXT NULL,
    modified_by_admin VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    modified_at       DATETIME NULL,
    created_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (modified_by_admin) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_employee_data (employee_id, data),
    INDEX idx_data (data)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_checkin_events (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    employee_id    INT NOT NULL,
    timestamp      DATETIME NOT NULL,
    tipo           ENUM('IN','OUT') NOT NULL,
    postazione     VARCHAR(50) NULL,
    device         VARCHAR(100) NULL,
    override_admin BOOLEAN NOT NULL DEFAULT FALSE,
    note           TEXT NULL,
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    INDEX idx_employee_ts (employee_id, timestamp)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_leave_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    tipo            ENUM('FE','PE','ML','altro') NOT NULL,
    data_inizio     DATE NOT NULL,
    data_fine       DATE NOT NULL,
    ore_totali      DECIMAL(4,2) NOT NULL,
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    approved_by     VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    approved_at     DATETIME NULL,
    note_dipendente TEXT NULL,
    note_admin      TEXT NULL,
    created_at      DATETIME DEFAULT NOW(),
    updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_employee (employee_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  // LAYER 4
  `CREATE TABLE team_handover_notes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    shift_id    INT NULL,
    data        DATE NOT NULL,
    postazione  ENUM('RECEPTION','PRIMO','SECONDO',
                    'UFFICIO','AMM.ZIONE') NOT NULL,
    testo       TEXT NOT NULL,
    priorita    ENUM('low','medium','high') NOT NULL DEFAULT 'low',
    letta_da    JSON NULL,
    created_at  DATETIME DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES team_scheduled_shifts(id) ON DELETE SET NULL,
    INDEX idx_data (data),
    INDEX idx_postazione (postazione)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_maintenance_tickets (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    employee_id   INT NOT NULL,
    studio_numero VARCHAR(10) NOT NULL,
    titolo        VARCHAR(200) NOT NULL,
    descrizione   TEXT NULL,
    status        ENUM('open','in_progress','closed') NOT NULL DEFAULT 'open',
    foto_url      VARCHAR(500) NULL,
    risolto_da    VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    risolto_at    DATETIME NULL,
    created_at    DATETIME DEFAULT NOW(),
    updated_at    DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (risolto_da) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_studio (studio_numero)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_monthly_reports (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    anno            YEAR NOT NULL,
    mese            TINYINT NOT NULL,
    ore_totali      DECIMAL(6,2) NOT NULL DEFAULT 0,
    giorni_lavorati TINYINT NOT NULL DEFAULT 0,
    stipendio_fisso DECIMAL(8,2) NULL,
    ore_extra_pos   DECIMAL(5,2) NOT NULL DEFAULT 0,
    ore_extra_neg   DECIMAL(5,2) NOT NULL DEFAULT 0,
    importo_extra   DECIMAL(8,2) NULL,
    cnt_FE          TINYINT NOT NULL DEFAULT 0,
    cnt_PE          TINYINT NOT NULL DEFAULT 0,
    cnt_ML          TINYINT NOT NULL DEFAULT 0,
    cnt_F           TINYINT NOT NULL DEFAULT 0,
    cnt_AI          TINYINT NOT NULL DEFAULT 0,
    cnt_AG          TINYINT NOT NULL DEFAULT 0,
    cnt_MT          TINYINT NOT NULL DEFAULT 0,
    cnt_IN          TINYINT NOT NULL DEFAULT 0,
    export_at       DATETIME NULL,
    locked          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME DEFAULT NOW(),
    updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    UNIQUE KEY uq_employee_mese (employee_id, anno, mese)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  // LAYER 5
  `CREATE TABLE team_profile_change_requests (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    employee_id      INT NOT NULL,
    campo_modificato VARCHAR(100) NOT NULL,
    valore_vecchio   TEXT NULL,
    valore_nuovo     TEXT NOT NULL,
    motivazione      TEXT NULL,
    status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at     DATETIME DEFAULT NOW(),
    reviewed_by      VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    reviewed_at      DATETIME NULL,
    note_admin       TEXT NULL,
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_documents (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    member_id           INT NOT NULL,
    tipo                ENUM('carta_identita','codice_fiscale',
                            'permesso_soggiorno','patente',
                            'certificato_medico','diploma','contratto',
                            'busta_paga','report_mensile',
                            'comunicazione','altro') NOT NULL,
    titolo              VARCHAR(200) NOT NULL,
    caricato_da         ENUM('employee','admin') NOT NULL,
    visibile_dipendente BOOLEAN NOT NULL DEFAULT TRUE,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    scadenza            DATE NULL,
    created_at          DATETIME DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member (member_id),
    INDEX idx_scadenza (scadenza)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_document_versions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    document_id     INT NOT NULL,
    versione_numero TINYINT NOT NULL DEFAULT 1,
    file_url        VARCHAR(500) NOT NULL,
    file_name       VARCHAR(200) NOT NULL,
    file_size       INT NULL,
    mime_type       VARCHAR(100) NULL,
    hash_file       VARCHAR(64) NULL,
    uploaded_by     VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    uploaded_at     DATETIME DEFAULT NOW(),
    note_versione   TEXT NULL,
    FOREIGN KEY (document_id) REFERENCES team_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_document_alerts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NULL,
    employee_id INT NOT NULL,
    tipo        ENUM('scadenza','mancante','aggiornamento_richiesto') NOT NULL,
    data_alert  DATE NOT NULL,
    inviato_at  DATETIME NULL,
    risolto     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME DEFAULT NOW(),
    FOREIGN KEY (document_id) REFERENCES team_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    INDEX idx_data_alert (data_alert),
    INDEX idx_risolto (risolto)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`,

  `CREATE TABLE team_employee_activity_log (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    employee_id       INT NOT NULL,
    eseguita_da       VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci NULL,
    azione            VARCHAR(100) NOT NULL,
    entita_modificata VARCHAR(50) NULL,
    entita_id         INT NULL,
    valore_prima      TEXT NULL,
    valore_dopo       TEXT NULL,
    ip_address        VARCHAR(45) NULL,
    created_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES team_employees(id) ON DELETE CASCADE,
    FOREIGN KEY (eseguita_da) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;`
];

async function run() {
  console.log("Inizia esecuzione CREATES...");
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    try {
      await db.execute(sql.raw(q));
      console.log(`[OK] Tabella ${i + 1} creata.`);
    } catch (e: any) {
      // If table already exists, we skip the error or log it and continue
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`[OK] Tabella ${i + 1} esiste già.`);
      } else {
        console.error(`[ERRORE] Fallita creazione query n. ${i + 1}`);
        console.error(e);
        process.exit(1);
      }
    }
  }
  
  // VERIFICA FINALE
  try {
    const res = await db.execute(sql`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'stargem_v2'
      AND TABLE_NAME LIKE 'team_%'
      ORDER BY TABLE_NAME;
    `);
    console.log("\n=== VERIFICA FINALE ===");
    console.table(res[0]);
  } catch(e) {
    console.error("Errore Verifica:", e);
  }

  process.exit(0);
}

run();
