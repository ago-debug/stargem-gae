import { db } from './server/db';
import { memberships, members, payments } from './shared/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';

async function run() {
  console.time('Old Query');
  await db
      .select({ id: memberships.id })
      .from(memberships)
      .leftJoin(members, eq(memberships.memberId, members.id))
      .leftJoin(payments, eq(memberships.id, payments.membershipId))
      .orderBy(desc(memberships.expiryDate), desc(memberships.id))
      .limit(50)
      .offset(0);
  console.timeEnd('Old Query');

  console.time('New Query Step 1 (ids)');
  const ids = await db
      .select({ id: memberships.id })
      .from(memberships)
      .leftJoin(members, eq(memberships.memberId, members.id))
      .orderBy(desc(memberships.expiryDate), desc(memberships.id))
      .limit(50)
      .offset(0);
  console.timeEnd('New Query Step 1 (ids)');

  if (ids.length > 0) {
      console.time('New Query Step 2 (data)');
      await db
          .select({ id: memberships.id, payId: payments.id })
          .from(memberships)
          .leftJoin(members, eq(memberships.memberId, members.id))
          .leftJoin(payments, eq(memberships.id, payments.membershipId))
          .where(inArray(memberships.id, ids.map(i => i.id)));
      console.timeEnd('New Query Step 2 (data)');
  }
  process.exit(0);
}
run();
