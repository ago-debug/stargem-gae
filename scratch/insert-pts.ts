import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema";

const pts = [
  { firstName: 'Marco', lastName: 'Maccari', email: 'marco.maccarimack@gmail.com', phone: null, participantType: 'PERSONAL_TRAINER', staffStatus: 'ATTIVO' },
  { firstName: 'Maurizio', lastName: 'Cattaneo', email: 'maurizio.cattaneo09@gmail.com', phone: null, participantType: 'PERSONAL_TRAINER', staffStatus: 'ATTIVO' },
  { firstName: 'Donato', lastName: 'Palamara', email: null, phone: null, participantType: 'PERSONAL_TRAINER', staffStatus: 'ATTIVO' },
  { firstName: 'Davide', lastName: 'Bruzzese', email: 'davide.bruzzese@esteopatia46.it', phone: '3495437079', participantType: 'PERSONAL_TRAINER', staffStatus: 'ATTIVO' },
  { firstName: 'Gabriele', lastName: 'Notaro', email: 'gabrigabri79@gmail.com', phone: '3397828079', participantType: 'PERSONAL_TRAINER', staffStatus: 'ATTIVO' },
  { firstName: 'Giorgio', lastName: 'Pallikunnel', email: null, phone: null, participantType: 'PERSONAL_TRAINER', staffStatus: 'ATTIVO' },
];

async function run() {
  console.log("Inserting Personal Trainers...");
  for (const pt of pts) {
    await db.insert(schema.members).values(pt as any);
  }
  console.log("Done inserting PTs.");
  process.exit(0);
}
run();
