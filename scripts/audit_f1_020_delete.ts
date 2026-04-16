import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== DELETE M_DUP ===");
  const [qDel] = await connection.query(`
    DELETE m_dup FROM members m_dup
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
  console.log(qDel);

  console.log("\n=== CONTA FINALE ===");
  const [qCount] = await connection.query(`
    SELECT
      COUNT(*) as totale,
      SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as disattivati_rimasti,
      SUM(CASE WHEN notes LIKE '%DUPLICATO-EMAIL%' THEN 1 ELSE 0 END) as ancora_flaggati
    FROM members;
  `);
  console.log(JSON.stringify(qCount, null, 2));

  await connection.end();
}

run().catch(console.error);
