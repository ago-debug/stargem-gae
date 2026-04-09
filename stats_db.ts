import { db } from './server/db';
import { sql } from 'drizzle-orm';
import { members, courses, enrollments, payments, studioBookings, studios, promoRules, instructorAgreements, carnetWallets } from './shared/schema';

async function run() {
  try {
    const [tables] = await db.execute(sql`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    const resMembers = await db.select({ c: sql`count(*)` }).from(members);
    const resCourses = await db.select({ c: sql`count(*)` }).from(courses);
    const resEnrollments = await db.select({ c: sql`count(*)` }).from(enrollments);
    const resPayments = await db.select({ c: sql`count(*)` }).from(payments);
    const resStudios = await db.select({ c: sql`count(*)` }).from(studios);
    const resStudioBookings = await db.select({ c: sql`count(*)` }).from(studioBookings);
    
    // Novità
    const resPromo = await db.select({ c: sql`count(*)` }).from(promoRules);
    const resAgreements = await db.select({ c: sql`count(*)` }).from(instructorAgreements);
    const resCarnets = await db.select({ c: sql`count(*)` }).from(carnetWallets);

    console.log(`Tabelle Totali: ${tables[0].table_count}`);
    console.log(`Membri (Anagrafiche): ${resMembers[0].c}`);
    console.log(`Corsi/Attività: ${resCourses[0].c}`);
    console.log(`Iscrizioni: ${resEnrollments[0].c}`);
    console.log(`Pagamenti Registrati: ${resPayments[0].c}`);
    console.log(`Aule Reali: ${resStudios[0].c}`);
    console.log(`Prenotazioni Estra/Eventi: ${resStudioBookings[0].c}`);
    console.log(`Regole Promo: ${resPromo[0].c}`);
    console.log(`Accordi Insegnanti: ${resAgreements[0].c}`);
    console.log(`Carnet Prepagati: ${resCarnets[0].c}`);
  } catch(e) {
    console.log("Error:", e);
  }
  process.exit(0);
}

run();
