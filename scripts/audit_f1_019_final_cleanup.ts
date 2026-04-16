import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== PULIZIA 1: CF typo ===");
  const [q1del] = await connection.query(`DELETE FROM members WHERE id IN (9568, 9569);`);
  console.log(q1del);
  
  const [q1ver] = await connection.query(`SELECT COUNT(*) as count FROM members WHERE id IN (9568, 9569);`);
  console.log("Verifica ID eliminati (atteso 0):", (q1ver as any)[0].count);

  console.log("\n=== PULIZIA 2: Email duplicate senza CF ===");
  const [q2upd] = await connection.query(`
    UPDATE members m
    JOIN (
      SELECT MIN(id) as id_min, email
      FROM members
      WHERE email IS NOT NULL
        AND email != ''
        AND (fiscal_code IS NULL
          OR fiscal_code = '')
        AND (participant_type NOT IN
          ('DIPENDENTE','INSEGNANTE',
           'PERSONAL_TRAINER')
          OR participant_type IS NULL)
      GROUP BY email
      HAVING COUNT(*) > 1
    ) t ON m.email = t.email
      AND m.id != t.id_min
      AND (m.fiscal_code IS NULL
        OR m.fiscal_code = '')
    SET m.notes = CONCAT(
      COALESCE(m.notes,''),
      ' [DUPLICATO-EMAIL: da verificare]'
    ),
    m.active = 0;
  `);
  console.log(q2upd);

  const [q2ver] = await connection.query(`
    SELECT COUNT(*) as flaggati
    FROM members
    WHERE notes LIKE '%DUPLICATO-EMAIL%';
  `);
  console.log(JSON.stringify(q2ver, null, 2));

  console.log("\n=== PULIZIA 3: Conta finale ===");
  const [q3] = await connection.query(`
    SELECT
      COUNT(*) as totale,
      SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END)
        as disattivati_da_verificare,
      SUM(CASE WHEN fiscal_code IS NULL
        OR fiscal_code = '' THEN 1 ELSE 0 END)
        as senza_cf,
      SUM(CASE WHEN notes LIKE '%INVALID%'
        OR notes LIKE '%SOSPETTO%'
        OR notes LIKE '%DUPLICATO%'
        OR notes LIKE '%VERIFICARE%'
        THEN 1 ELSE 0 END) as flaggati_totali
    FROM members;
  `);
  console.log(JSON.stringify(q3, null, 2));

  await connection.end();
}

run().catch(console.error);
