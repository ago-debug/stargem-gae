import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function test() {
  let filterConditions: any[] = [];
  filterConditions.push(sql`(m.active = false OR m.active = 0 OR m.active IS NULL)`);
  filterConditions.push(sql`m.gender = 'M'`);

  const joinSql = (sqls: any[]) => {
    if (sqls.length === 0) return sql`1=1`;
    return sqls.reduce((acc, curr, i) => {
      if (i === 0) return curr;
      return sql`${acc} AND ${curr}`;
    }, sql`` as any);
  };

  const finalFilterCondition = joinSql(filterConditions);
  const searchCondition = sql`1 = 1`;

  const query = sql`
      SELECT COUNT(*) as count FROM (
        SELECT id, first_name, last_name, email, phone, mobile, fiscal_code, card_number, 
               gender, has_medical_certificate, medical_certificate_expiry, is_minor,
               participant_type, entity_card_number, active 
        FROM members
        UNION ALL
        SELECT (id + 1000000) as id, first_name, last_name, email, phone, NULL as mobile, NULL as fiscal_code, NULL as card_number, 
               NULL as gender, false as has_medical_certificate, NULL as medical_certificate_expiry, false as is_minor,
               'INSEGNANTE' as participant_type, NULL as entity_card_number, active 
        FROM instructors
      ) as m WHERE ${searchCondition} AND ${finalFilterCondition}`;

  console.log("SQL generated:", query);

  try {
    const [result] = await db.execute(query);
    console.log("Result:", result);
  } catch (e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
}

test();
