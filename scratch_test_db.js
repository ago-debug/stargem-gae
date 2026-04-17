const { db } = require('./server/db');
const schema = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function run() {
  const records = await db.select({
      id: schema.teamEmployees.id,
      userId: schema.teamEmployees.userId,
      memberId: schema.teamEmployees.memberId,
      firstName: schema.members.firstName,
      lastName: schema.members.lastName,
      email: schema.members.email
  })
  .from(schema.teamEmployees)
  .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId));
  
  console.log("RECORDS:");
  console.log(records);
  process.exit(0);
}
run();
