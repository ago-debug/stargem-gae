import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const sql = `
    ALTER TABLE members
      ADD COLUMN tutor1_fiscal_code VARCHAR(16) NULL,
      ADD COLUMN tutor1_phone       VARCHAR(20) NULL,
      ADD COLUMN tutor1_email       VARCHAR(255) NULL,
      ADD COLUMN tutor2_fiscal_code VARCHAR(16) NULL,
      ADD COLUMN tutor2_phone       VARCHAR(20) NULL,
      ADD COLUMN tutor2_email       VARCHAR(255) NULL,
      ADD COLUMN nationality        VARCHAR(100) NULL,
      ADD COLUMN region             VARCHAR(100) NULL,
      ADD COLUMN consent_image      TINYINT(1) DEFAULT 0,
      ADD COLUMN consent_marketing  TINYINT(1) DEFAULT 0;
  `;
  await connection.query(sql);
  console.log('ALTER TABLE executed successfully.');
  await connection.end();
}

run().catch(console.error);
