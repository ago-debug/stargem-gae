import { db } from './server/db.ts';
import { userSessionSegments } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function run() {
  const segments = await db.select().from(userSessionSegments).where(eq(userSessionSegments.userId, 'admin-id'));
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
  const aperto = segments.find(s => {
      const segDate = new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
      return s.endedAt === null && segDate === todayStr;
  });
  console.log('TodayStr:', todayStr);
  console.log('Aperto:', aperto);
  const now = Date.now();
  console.log('Now:', now);
  for (let s of segments) {
    if (s.endedAt === null) {
      console.log('Open segment:', s.id, new Date(s.startedAt).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }));
    }
  }
  process.exit(0);
}
run();
