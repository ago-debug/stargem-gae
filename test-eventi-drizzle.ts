import { db } from './server/db.ts';
import { strategicEvents } from './shared/schema.ts';
import { lte, gte, eq, or, and, isNull, sql } from 'drizzle-orm';

async function test(dateStr: string) {
  const events = await db.select()
    .from(strategicEvents)
    .where(
        or(
            and(
                sql`DATE(${strategicEvents.startDate}) <= ${dateStr}`,
                sql`DATE(${strategicEvents.endDate}) >= ${dateStr}`
            ),
            and(
                isNull(strategicEvents.endDate),
                sql`DATE(${strategicEvents.startDate}) = ${dateStr}`
            )
        )
    );
  console.log(`Events for ${dateStr}:`, events);
}

async function run() {
  await test('2026-04-19');
  await test('2026-04-20');
  await test('2026-05-01');
  process.exit(0);
}
run();
