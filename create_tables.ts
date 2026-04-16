import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gem_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel ENUM('member','staff') NOT NULL,
        participant_id INT NOT NULL,
        participant_user_id VARCHAR(255) NULL,
        status ENUM('bot','human','closed') DEFAULT 'bot',
        assigned_to VARCHAR(255) NULL,
        bot_context JSON NULL,
        last_message_at DATETIME NULL,
        unread_team INT DEFAULT 0,
        unread_participant INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_id) REFERENCES members(id),
        INDEX idx_channel (channel),
        INDEX idx_participant_id (participant_id),
        INDEX idx_status (status),
        INDEX idx_last_message_at (last_message_at),
        INDEX idx_assigned_to (assigned_to)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gem_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_type ENUM('member','staff','team','bot') NOT NULL,
        sender_id VARCHAR(255) NULL,
        content TEXT NOT NULL,
        attachment_url VARCHAR(500) NULL,
        attachment_name VARCHAR(255) NULL,
        attachment_size INT NULL,
        quick_link_type ENUM('corso','tessera','pagamento') NULL,
        quick_link_id INT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES gem_conversations(id) ON DELETE CASCADE,
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_sender_type (sender_type),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS member_uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        document_type ENUM('certificato_medico','documento_identita','altro') NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_size INT NULL,
        mime_type VARCHAR(100) NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_by VARCHAR(255) NULL,
        verified_at DATETIME NULL,
        notes TEXT NULL,
        season_id INT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id),
        INDEX idx_member_id (member_id),
        INDEX idx_document_type (document_type),
        INDEX idx_verified_by (verified_by),
        INDEX idx_season_id (season_id)
      )
    `);

    console.log("Tabelle create con successo");
    
    // Mostriamo le tabelle per verifica
    const [t1] = await db.execute(sql`SHOW TABLES LIKE 'gem%'`);
    console.table(t1);
    
    const [t2] = await db.execute(sql`SHOW TABLES LIKE 'member_uploads'`);
    console.table(t2);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
