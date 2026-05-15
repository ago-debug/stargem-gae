import { db } from "../../server/db";
import { memberships } from "../../shared/schema";
import { like, or, isNull, lt, gt } from "drizzle-orm";
import { resolveMembershipSeason } from "../../server/utils/season";
import { generateMembershipNumber, calculateMembershipExpiry } from "../../server/utils/membership";
import fs from "fs";
import path from "path";

async function runBonifica() {
  console.log("Inizio script bonifica tessere corrotte F1-007...");

  // 1. Trovare tutte le tessere corrotte
  const badMemberships = await db.select().from(memberships).where(
    or(
      like(memberships.membershipNumber, 'CORRENTE-%'),
      like(memberships.membershipNumber, 'SUCCESSIVA-%'),
      isNull(memberships.expiryDate),
      lt(memberships.expiryDate, new Date('2020-01-01')),
      gt(memberships.expiryDate, new Date('2099-12-31'))
    )
  );

  console.log(`Trovate ${badMemberships.length} tessere corrotte.`);

  if (badMemberships.length === 0) {
    console.log("Nessuna bonifica necessaria. Termino.");
    process.exit(0);
  }

  // ROLLBACK STRATEGY: Creiamo un backup JSON prima di qualsiasi update
  const backupPath = path.join(__dirname, `backup_pre_bonifica_F1-007_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(badMemberships, null, 2));
  console.log(`✅ ROLLBACK BACKUP creato in: ${backupPath}`);

  const logChanges = [];

  for (const m of badMemberships) {
    try {
      // 2. Ricavare il seasonCode corretto dalla issueDate o createdAt
      const referenceDate = m.issueDate || m.createdAt || new Date();
      // Se la tessera era contrassegnata come SUCCESSIVA nel DB ma non c'è traccia, 
      // usiamo la stringa corrotta se conteneva "SUCCESSIVA"
      const isSuccessiva = m.membershipNumber.startsWith("SUCCESSIVA");
      const competence = m.seasonCompetence || (isSuccessiva ? "SUCCESSIVA" : "CORRENTE");

      const seasonBounds = resolveMembershipSeason(referenceDate, competence as "CORRENTE" | "SUCCESSIVA");
      
      const startYY = String(seasonBounds.seasonStartYear).slice(-2);
      const endYY = String(seasonBounds.seasonEndYear).slice(-2);
      const seasonCode = `${startYY}${endYY}`; // es: "2526"

      // 3. Aggiornare membershipNumber con formato corretto
      // Nota: gempass usa 6 cifre padding dal member_id
      const newMembershipNumber = generateMembershipNumber(seasonCode, m.memberId!);
      
      // 4. Aggiornare expiryDate al 31/08
      const newExpiryDate = calculateMembershipExpiry(seasonCode);

      // Log the change
      logChanges.push({
        id: m.id,
        memberId: m.memberId,
        oldNumber: m.membershipNumber,
        newNumber: newMembershipNumber,
        oldExpiry: m.expiryDate,
        newExpiry: newExpiryDate
      });

      // Esegui l'update nel DB (Commentato per sicurezza - scommentare per l'esecuzione reale)
      /*
      await db.update(memberships)
        .set({
          membershipNumber: newMembershipNumber,
          barcode: newMembershipNumber, // Allineiamo anche il barcode
          expiryDate: newExpiryDate,
          seasonStartYear: seasonBounds.seasonStartYear,
          seasonEndYear: seasonBounds.seasonEndYear
        })
        .where(eq(memberships.id, m.id));
      */

    } catch (e) {
      console.error(`Errore durante bonifica record ID ${m.id}:`, e);
    }
  }

  // Salva il log delle modifiche effettuate
  const logPath = path.join(__dirname, `log_modifiche_F1-007_${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(logChanges, null, 2));
  console.log(`✅ LOG MODIFICHE creato in: ${logPath}`);
  console.log("Simulazione bonifica completata. (Query di update sono commentate).");
  
  process.exit(0);
}

runBonifica().catch(console.error);
