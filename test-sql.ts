import { sql } from 'drizzle-orm';

const c1 = sql`m.active = true`;
const c2 = sql`m.gender = 'M'`;
const arr = [c1, c2];

const joinSql = (sqls: any[]) => {
  if (sqls.length === 0) return sql`1=1`;
  return sqls.reduce((acc, curr, i) => {
    if (i === 0) return curr;
    return sql`${acc} AND ${curr}`;
  }, sql`` as any);
};

console.log(joinSql(arr));
