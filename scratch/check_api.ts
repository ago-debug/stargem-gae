import { config } from "dotenv";
config();
import { db } from "../server/db";
import { members, teamEmployees } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  const records = await db
    .select({
      id: teamEmployees.id,
      memberId: teamEmployees.memberId,
      userId: teamEmployees.userId,
      displayOrder: teamEmployees.displayOrder,
      team: teamEmployees.team,
      tariffaOraria: teamEmployees.tariffaOraria,
      stipendioFissoMensile: teamEmployees.stipendioFissoMensile,
      attivo: teamEmployees.attivo,
      noteHr: teamEmployees.noteHr,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      phone: members.phone,
      mobile: members.mobile,
      photoUrl: members.photoUrl
    })
    .from(teamEmployees)
    .innerJoin(members, eq(members.id, teamEmployees.memberId))
    .orderBy(teamEmployees.displayOrder);
  console.log(records);
  process.exit(0);
}
run();
