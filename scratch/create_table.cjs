const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NULL,
      action VARCHAR(100) NOT NULL,
      prompt_tokens INT DEFAULT 0,
      completion_tokens INT DEFAULT 0,
      total_tokens INT DEFAULT 0,
      model VARCHAR(50) NOT NULL,
      cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table created.");
  process.exit(0);
}
run();
