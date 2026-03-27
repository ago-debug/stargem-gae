const { db } = require('../server/db');
const { sql } = require('drizzle-orm');

async function run() {
  const [act] = await db.execute(sql`SHOW CREATE TABLE activities_unified;`);
  console.log(act[0]['Create Table']);
  
  const [enr] = await db.execute(sql`SHOW CREATE TABLE enrollments_unified;`);
  console.log(enr[0]['Create Table']);
  process.exit(0);
}
run();
