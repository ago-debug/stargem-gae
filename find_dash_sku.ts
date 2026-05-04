import { db } from './server/db';
import { courses } from './shared/schema';
import { desc, eq, isNull, or } from 'drizzle-orm';

async function run() {
  const latest = await db.query.courses.findMany({
    where: eq(courses.instructorId, 9514),
    orderBy: [desc(courses.createdAt)],
    limit: 10
  });
  console.log(latest.map(c => ({ id: c.id, name: c.name, sku: c.sku, seasonId: c.seasonId, startDate: c.startDate })));
  process.exit(0);
}
run();
