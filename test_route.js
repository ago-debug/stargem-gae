import 'dotenv/config';
import { db } from './server/db.ts';
import { storage } from './server/storage.ts';

async function run() {
  const allEvents = await storage.getStrategicEvents();
  const activeSeason = await storage.getActiveSeason();
  
  const from = '2026-09-01';
  const to = '2027-06-30';
  const targetSeasonId = activeSeason?.id;

  const closedEvents = allEvents.filter(e => {
    const effSeasonId = e.seasonId || activeSeason?.id;
    if (targetSeasonId && effSeasonId !== targetSeasonId) return false;
    
    const type = e.eventType?.toLowerCase() || '';
    const isClosedType = type.includes('festivit') || type.includes('chiusura') || type.includes('ferie') || e.isPublicHoliday;
    if (!isClosedType || e.affectsCalendar !== true) return false;

    const eStart = new Date(e.startDate).toISOString().split('T')[0];
    const eEnd = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : eStart;

    return eStart <= to && eEnd >= from;
  });

  const closedDays = new Set();
  
  closedEvents.forEach(e => {
    const start = new Date(e.startDate);
    const end = e.endDate ? new Date(e.endDate) : start;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split('T')[0];
      if (dayStr >= from && dayStr <= to) {
        closedDays.add(dayStr);
      }
    }
  });

  console.log({ closedDays: Array.from(closedDays).sort() });
  process.exit(0);
}
run().catch(console.error);
