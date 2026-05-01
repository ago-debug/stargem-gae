import mysql from 'mysql2/promise';

async function runAudit() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  console.log("--- Q1: Sale ---");
  const [q1] = await conn.execute(`SELECT COUNT(*) as totali, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as attivi FROM studios`);
  console.table(q1);

  console.log("--- Q2: Insegnanti (da members) ---");
  const [q2] = await conn.execute(`SELECT COUNT(*) as count FROM members WHERE active=1 AND (LOWER(participant_type) LIKE '%insegnante%' OR LOWER(participant_type) LIKE '%staff%')`);
  console.table(q2);
  

  console.log("--- Q3: Categorie ---");
  const [q3] = await conn.execute(`
    SELECT COUNT(*) as count 
    FROM custom_list_items i
    JOIN custom_lists l ON i.list_id = l.id
    WHERE l.system_name = 'categorie' AND i.active = 1
  `);
  console.table(q3);

  console.log("--- Q4: Tesserati attivi 25/26 ---");
  const [q4] = await conn.execute(`SELECT COUNT(*) as count FROM memberships m JOIN seasons s ON m.season_id=s.id WHERE s.active=1`);
  console.table(q4);

  console.log("--- Q5: Iscrizioni attive ---");
  const [q5] = await conn.execute(`SELECT COUNT(*) as count FROM enrollments WHERE (status='active' OR status IS NULL)`);
  console.table(q5);

  console.log("--- Q6: Certificati scaduti ---");
  const [q6] = await conn.execute(`SELECT COUNT(*) as count FROM medical_certificates WHERE expiry_date < CURDATE()`);
  console.table(q6);

  console.log("--- Q7: Tessere mancanti (utenti attivi senza tessera attiva per stagione corrente) ---");
  const [q7] = await conn.execute(`
    SELECT COUNT(*) as count 
    FROM members m 
    WHERE NOT EXISTS (
      SELECT 1 FROM memberships ms 
      JOIN seasons s ON ms.season_id = s.id 
      WHERE ms.member_id = m.id AND s.active = 1
    ) AND m.active = 1
  `);
  console.table(q7);

  conn.end();
}

runAudit().catch(console.error);
