import 'dotenv/config';
import { db } from './server/db.js';
import { teamEmployees, teamScheduledShifts, teamPostazioni, members } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const dip = await db.select({
    lastName: members.lastName,
    team: teamEmployees.team
  }).from(teamEmployees)
    .innerJoin(members, eq(members.id, teamEmployees.memberId))
    .where(eq(teamEmployees.attivo, true));

  console.log('Dipendenti:', dip.length, '— primo:', dip[0]?.lastName, dip[0]?.team);

  const tdy = new Date().toISOString().substring(0,10);
  const turni = await db.select().from(teamScheduledShifts)
    // .where(eq(teamScheduledShifts.data, new Date(tdy)));  // simple count

  const turniOggi = turni.filter(t => new Date(t.data).toISOString().substring(0,10) === tdy);
  console.log('Turni oggi:', turniOggi.length);

  const post = await db.select().from(teamPostazioni);
  console.log('Postazioni:', post.length);

  process.exit(0);
}

run().catch(console.error);
