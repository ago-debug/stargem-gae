import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("--- QUERY 1 ---");
  const res1 = await db.execute(sql`SELECT * FROM medical_certificates WHERE member_id = 14181`);
  console.log(res1[0] || res1);

  console.log("\n--- QUERY 2 ---");
  const res2 = await db.execute(sql`
SELECT m.id, m.last_name, m.first_name,
  m.fiscal_code, m.email, m.address,
  m.profession, m.mother_first_name,
  ms.membership_number,
  p.amount, p.paid_date,
  mc.expiry_date, mc.status as cert_status
FROM members m
JOIN memberships ms ON ms.member_id = m.id
  AND ms.status = 'active'
JOIN payments p ON p.member_id = m.id
JOIN medical_certificates mc
  ON mc.member_id = m.id
  AND mc.status = 'valid'
WHERE m.address IS NOT NULL
ORDER BY mc.expiry_date DESC
LIMIT 5;
  `);
  console.table(res2[0] || res2);
  process.exit(0);
}
run().catch(console.error);
