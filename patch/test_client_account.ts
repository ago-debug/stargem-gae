import { db } from '../server/db';
import { users, members } from '../shared/schema';
import { eq, isNotNull, and, isNull, notInArray } from 'drizzle-orm';
import { hashPassword } from '../server/auth';
import crypto from 'crypto';

async function runTestClientCreation() {
  try {
    // STEP 1 - Trova membro
    const [member] = await db.select()
      .from(members)
      .where(
        and(
          isNotNull(members.email),
          isNull(members.userId),
          notInArray(members.participantType, ['DIPENDENTE', 'INSEGNANTE', 'PERSONAL_TRAINER'])
        )
      )
      .limit(1);

    if (!member) {
      console.log("Nessun membro idoneo trovato per il test");
      process.exit(1);
    }

    console.log(`STEP 1 - Membro scelto: ID ${member.id}, ${member.firstName} ${member.lastName}, ${member.email}`);

    // Clean up if a user with this email mistakenly already exists
    await db.delete(users).where(eq(users.email, member.email!));

    // STEP 2 - Crea auth account 
    const uuid = crypto.randomUUID();
    const hash = await hashPassword("Test2026!");
    await db.insert(users).values({
      id: uuid,
      email: member.email!,
      username: member.email!,
      password: hash,
      role: 'client',
      emailVerified: true,
      firstName: member.firstName,
      lastName: member.lastName,
      createdAt: new Date()
    } as any);
    console.log(`STEP 2 - Creato user ${uuid} con ruolo client`);

    // STEP 3 - Aggiorna member_id
    await db.update(members)
      .set({ userId: uuid })
      .where(eq(members.id, member.id));
    console.log(`STEP 3 - Collegato member_id ${member.id} al nuovo user`);

    // STEP 4 - Verify Join
    const [verify] = await db.select({
      userId: users.id, email: users.email, role: users.role,
      memberId: members.id, firstName: members.firstName, lastName: members.lastName
    })
    .from(users)
    .innerJoin(members, eq(members.userId, users.id))
    .where(eq(users.role, 'client'))
    .limit(1);

    console.log(`STEP 4 - Verifica:\n ${JSON.stringify(verify, null, 2)}`);
    console.log(`Use email ${verify.email} for curl POST api/login`);
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runTestClientCreation();
