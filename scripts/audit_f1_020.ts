import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== STEP 1 - Confronto puntuale ===");
  const [q1] = await connection.query(`
    SELECT
      m_dup.id as id_duplicato,
      m_orig.id as id_originale,
      m_dup.first_name, m_dup.last_name,
      m_dup.email,
      m_dup.fiscal_code as cf_duplicato,
      m_orig.fiscal_code as cf_originale,
      m_dup.phone as tel_duplicato,
      m_orig.phone as tel_originale,
      m_dup.created_at as data_duplicato,
      m_orig.created_at as data_originale
    FROM members m_dup
    JOIN members m_orig
      ON m_dup.email = m_orig.email
      AND m_dup.id != m_orig.id
      AND m_orig.active != 0
    WHERE m_dup.active = 0
      AND m_dup.notes LIKE '%DUPLICATO-EMAIL%'
    LIMIT 20;
  `);
  console.log(JSON.stringify(q1, null, 2));

  console.log("\n=== STEP 2 - Potenzialmente non duplicati (CF diversi) ===");
  const [q2] = await connection.query(`
    SELECT COUNT(*) as da_verificare_manualmente
    FROM members m_dup
    JOIN members m_orig
      ON m_dup.email = m_orig.email
      AND m_dup.id != m_orig.id
      AND m_orig.active != 0
    WHERE m_dup.active = 0
      AND m_dup.notes LIKE '%DUPLICATO-EMAIL%'
      AND (
        m_dup.fiscal_code != m_orig.fiscal_code
        OR (m_dup.fiscal_code IS NOT NULL
            AND m_orig.fiscal_code IS NULL)
        OR (m_dup.fiscal_code IS NULL
            AND m_orig.fiscal_code IS NOT NULL)
      );
  `);
  console.log(JSON.stringify(q2, null, 2));

  console.log("\n=== STEP 3 - Duplicati CERTI (Stessa mail, stesso CF, steso nome/cognome) ===");
  const [q3] = await connection.query(`
    SELECT COUNT(*) as duplicati_certi
    FROM members m_dup
    JOIN members m_orig
      ON m_dup.email = m_orig.email
      AND m_dup.id != m_orig.id
      AND m_orig.active != 0
    WHERE m_dup.active = 0
      AND m_dup.notes LIKE '%DUPLICATO-EMAIL%'
      AND m_dup.first_name = m_orig.first_name
      AND m_dup.last_name = m_orig.last_name
      AND (
        m_dup.fiscal_code = m_orig.fiscal_code
        OR (m_dup.fiscal_code IS NULL
            AND m_orig.fiscal_code IS NULL)
      );
  `);
  console.log(JSON.stringify(q3, null, 2));

  await connection.end();
}

run().catch(console.error);
