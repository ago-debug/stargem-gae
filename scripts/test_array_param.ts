import 'dotenv/config';
import { db } from './server/db';
import { courses } from './shared/schema';

async function main() {
  try {
    const dataToSave = {
      sku: "testGae1234",
      name: "pippo",
      startDate: "2026-04-08" as any,
    };
    await db.insert(courses).values(dataToSave as any);
  } catch (err: any) {
    console.error("MYSQL ERROR:", err.message);
  }
}
main().then(()=>process.exit(0)).catch(console.error);
