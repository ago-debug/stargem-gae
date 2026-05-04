import { db } from './server/db';
import { courses } from './shared/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const latest = await db.query.courses.findMany({
    where: eq(courses.seasonId, 2)
  });
  console.log(latest.length, latest.map(c => c.name));
  process.exit(0);
}
run();
