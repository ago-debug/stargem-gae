import { db } from '/Users/gaetano1/SVILUPPO/StarGem_manager/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log("--- STEP 1 ---");
    const [q1] = await db.execute(sql`DESCRIBE users`);
    console.log(JSON.stringify(q1, null, 2));

    console.log("--- STEP 2 ---");
    const [q2] = await db.execute(sql`SELECT id, username, email, role, email_verified, otp_token IS NOT NULL AS ha_otp, created_at FROM users ORDER BY role, username`);
    console.log(JSON.stringify(q2, null, 2));

    console.log("--- STEP 3 ---");
    const [q3] = await db.execute(sql`SELECT role, COUNT(*) AS totale, SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) AS con_email, SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) AS verificati FROM users GROUP BY role ORDER BY totale DESC`);
    console.log(JSON.stringify(q3, null, 2));

    console.log("--- STEP 4 ---");
    const [q4] = await db.execute(sql`SELECT id, name, description, LEFT(permissions, 120) AS permissions_preview FROM user_roles ORDER BY name`);
    console.log(JSON.stringify(q4, null, 2));

    console.log("--- STEP 5 ---");
    const [q5] = await db.execute(sql`SELECT u.id, u.username, u.email, u.role, m.id AS member_id, m.first_name, m.last_name, m.participant_type, m.staff_status FROM users u LEFT JOIN members m ON m.user_id = u.id ORDER BY u.role, u.username`);
    console.log(JSON.stringify(q5, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }
}

run();
