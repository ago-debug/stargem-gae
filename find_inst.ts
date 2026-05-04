import { db } from './server/db';
import { instructors } from './shared/schema';
import { like } from 'drizzle-orm';

async function run() {
  const latest = await db.query.instructors.findMany({
    where: like(instructors.lastName, '%BORDONI%')
  });
  console.log(latest);
  process.exit(0);
}
run();
