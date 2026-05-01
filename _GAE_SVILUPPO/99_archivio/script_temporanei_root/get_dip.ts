import { db } from './server/db.ts';
import { teamEmployees } from './server/schema.ts';
async function run() {
    const list = await db.select().from(teamEmployees);
    console.log(list.map(e => `${e.id}: ${e.nome} ${e.cognome}`));
    process.exit(0);
}
run();
