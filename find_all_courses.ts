import { db } from './server/db';
import { courses } from './shared/schema';
import { desc, like, or } from 'drizzle-orm';

async function run() {
  const latest = await db.query.courses.findMany({
    where: or(like(courses.name, '%Acrobatica%'), like(courses.name, '%Gioco Ginnastica%')),
    orderBy: [desc(courses.createdAt)],
    limit: 20
  });
  console.log(latest.map(c => ({ id: c.id, name: c.name, sku: c.sku, seasonId: c.seasonId, dayOfWeek: c.dayOfWeek, startTime: c.startTime, createdAt: c.createdAt })));
  process.exit(0);
}
run();
