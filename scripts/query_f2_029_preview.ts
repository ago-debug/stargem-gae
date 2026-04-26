import 'dotenv/config';
import { getUnifiedActivitiesPreview } from '../server/services/unifiedBridge';

async function run() {
  const req = { query: {} } as any; // mock
  const activities = await getUnifiedActivitiesPreview(req);
  const sundayActivities = activities.filter(a => a.startDatetime && a.startDatetime.startsWith('2026-04-26'));
  console.log("Found", sundayActivities.length, "activities on 2026-04-26");
  for (let i = 0; i < Math.min(10, sundayActivities.length); i++) {
    console.log(sundayActivities[i].title, sundayActivities[i].startDatetime);
  }
}
run();
