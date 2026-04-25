import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const query = sql`
        SELECT 
          e.id as enrollment_id,
          e.member_id,
          e.course_id,
          e.status as enrollment_status,
          e.participation_type,
          e.enrollment_date,
          m.first_name,
          m.last_name,
          m.email,
          mem.membership_number,
          mem.expiry_date as membership_expiry_date,
          mem.status as membership_status,
          mc.expiry_date as medical_expiry_date,
          mc.status as medical_status,
          (SELECT COUNT(*) FROM attendances a WHERE a.member_id = e.member_id AND a.course_id = e.course_id) as presenze_count
        FROM enrollments e
        JOIN members m ON m.id = e.member_id
        LEFT JOIN (
          SELECT member_id, membership_number, expiry_date, status
          FROM (
            SELECT *, ROW_NUMBER() OVER(PARTITION BY member_id ORDER BY expiry_date DESC, id DESC) as rn
            FROM memberships
            WHERE season_id = (SELECT id FROM seasons WHERE status='active' LIMIT 1)
          ) ranked_mem
          WHERE rn = 1
        ) mem ON mem.member_id = m.id
        LEFT JOIN (
          SELECT member_id, expiry_date, status
          FROM (
            SELECT *, ROW_NUMBER() OVER(PARTITION BY member_id ORDER BY expiry_date DESC, id DESC) as rn
            FROM medical_certificates
          ) ranked_mc
          WHERE rn = 1
        ) mc ON mc.member_id = m.id
        WHERE e.course_id = 155
        LIMIT 5
      `;
  const res = await db.execute(query);
  console.table(res[0] || res);
  process.exit(0);
}
run().catch(console.error);
