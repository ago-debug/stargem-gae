const { db } = require('./server/db');
const schema = require('./shared/schema');

async function run() {
  const turni = await db.select().from(schema.teamShiftTemplates).limit(5);
  console.log("ESEMPIO TURNI:", turni);
  process.exit(0);
}
run();
