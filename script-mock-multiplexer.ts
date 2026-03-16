import { insertMembershipSchema } from "./shared/schema";
import { resolveMembershipSeason, generateMembershipNumber, generateBarcode } from "./server/utils/season";

async function runMock() {
  console.log("--- TEST METODO MULTIPLEXER API ---");
  
  const legacyBody = {
    memberId: 99,
    issueDate: new Date("2024-10-15T10:00:00.000Z"),
    expiryDate: new Date("2025-08-31T23:59:50.000Z"), // Inviata attualmente dalla UI
    fee: "25",
  };
  
  const newBody = {
    memberId: 99,
    issueDate: new Date("2024-10-15T10:00:00.000Z"),
    expiryDate: new Date("2025-08-31T23:59:50.000Z"), // Verrà comunque sovrascritta dal backend
    fee: "25",
    membershipType: "NUOVO",
    seasonCompetence: "CORRENTE"
  };

  const fakeExistingMemberships: any[] = [];
  
  for (const [name, body] of Object.entries({ "1. PAYLOAD LEGACY (Vecchia UI)": legacyBody, "2. NUOVO PAYLOAD (Stagione Strict)": newBody })) {
    console.log(`\n=> [Esecuzione] ${name}`);
    let validatedData = insertMembershipSchema.parse(body);

    if (validatedData.membershipType && validatedData.seasonCompetence) {
      console.log("   Rilevato payload moderno: entra in modalita STRICT SEASON");
      const seasonInfo = resolveMembershipSeason(validatedData.issueDate, validatedData.seasonCompetence as "CORRENTE" | "SUCCESSIVA");
      validatedData.seasonStartYear = seasonInfo.seasonStartYear;
      validatedData.seasonEndYear = seasonInfo.seasonEndYear;
      validatedData.expiryDate = seasonInfo.expiryDate;

      const hasExistingForSeason = fakeExistingMemberships.some(m => m.seasonEndYear === seasonInfo.seasonEndYear);
      if (hasExistingForSeason) {
        console.log("   [!] Bloccato dal check univocità.");
      } else {
        validatedData.membershipNumber = generateMembershipNumber(validatedData.memberId, seasonInfo.seasonStartYear, seasonInfo.seasonEndYear);
        validatedData.barcode = generateBarcode(validatedData.membershipNumber);
        validatedData.renewalType = `${validatedData.membershipType} - ${validatedData.seasonCompetence}`; // Bridge for current code
      }
    } else {
      console.log("   Rilevato payload vecchio: modalita FALLBACK");
      if (!validatedData.membershipNumber) {
        const currentDate = new Date(); // To mock: 2024
        const year1 = currentDate.getFullYear();
        const year2 = year1 + 1;
        validatedData.membershipNumber = `${validatedData.memberId}-${year1}/${year2}`;
      }
      if (!validatedData.barcode) {
        validatedData.barcode = validatedData.membershipNumber;
      }
    }
    console.log("   [DB Output Generato]:");
    console.log("   - Anni di Stagione:   ", validatedData.seasonStartYear, "-", validatedData.seasonEndYear);
    console.log("   - Scadenza Finale:    ", validatedData.expiryDate ? validatedData.expiryDate.toISOString().split('T')[0] : 'non generata');
    console.log("   - Membership Number:  ", validatedData.membershipNumber);
    console.log("   - Barcode Laser:      ", validatedData.barcode);
    console.log("   - Legacy renewalType: ", validatedData.renewalType);
  }
}

runMock().catch(console.error);
