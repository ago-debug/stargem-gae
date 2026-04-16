import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== STEP 2 - Delete 9541 ===");
  const [res2] = await connection.query(`DELETE FROM members WHERE id = 9541`);
  console.log(res2);

  console.log("\n=== STEP 3 - Flag 6758, 6759 ===");
  const [res3] = await connection.query(`
    UPDATE members
    SET notes = CONCAT(
      COALESCE(notes,''),
      ' [CF-TEST: TSTGEN verificare identità]'
    )
    WHERE id IN (6758, 6759);
  `);
  console.log(res3);

  console.log("\n=== STEP 4 - Final Verification ===");
  const [q4] = await connection.query(`
    SELECT COUNT(*) as totale_members,
           COUNT(DISTINCT fiscal_code) as cf_unici,
           COUNT(CASE WHEN fiscal_code IS NULL
                 OR fiscal_code = '' THEN 1 END)
                 as senza_cf
    FROM members;
  `);
  console.log(JSON.stringify(q4, null, 2));

  await connection.end();
}

run().catch(console.error);
