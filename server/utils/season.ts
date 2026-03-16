/**
 * Utilities for calculating Sports Season boundaries and generating
 * deterministic Membership Numbers and Barcodes.
 *
 * Rules:
 * - The sports season runs from September 1st to August 31st of the following year.
 * - 'CORRENTE': the season covering the issueDate
 * - 'SUCCESSIVA': the season following the 'CORRENTE' one
 */

export interface SeasonResult {
  seasonStartYear: number;
  seasonEndYear: number;
  expiryDate: Date;
}

/**
 * Calculates the semantic Season Bounds and Exact Expiry Date
 * based on the issue date and the requested competence.
 */
export function resolveMembershipSeason(
  issueDate: Date | string | number,
  seasonCompetence: "CORRENTE" | "SUCCESSIVA"
): SeasonResult {
  const date = new Date(issueDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid issueDate provided to resolveMembershipSeason");
  }

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth(); // 0-indexed (0 = Jan, 8 = Sep)
  const currentDay = date.getDate();

  let startYear: number;

  // Se siamo tra il 1 Gennaio e il 31 Agosto (incluso), la "stagione di emissione" è iniziata l'anno prima.
  // Es: 31 Agosto 2025 -> Appartiene alla stagione 2024-2025.
  if (currentMonth < 8 || (currentMonth === 8 && currentDay === 0 /* theoretical fallback */)) {
    // Note: getMonth() is 0-indexed. August is 7.
    // Wait, let's be precise. Month 8 is September.
    // If month < 8 (Jan-Aug), we are in the tail end of the season that started last year.
    startYear = currentYear - 1;
  } else {
    // If month >= 8 (Sep-Dec), we are in the new season starting this year.
    startYear = currentYear;
  }

  // Se l'utente ha pagato per l'anno prossimo in anticipo
  if (seasonCompetence === "SUCCESSIVA") {
    startYear += 1;
  }

  const endYear = startYear + 1;
  
  // La scadenza è SEMPRE il 31 Agosto (mese 7 base zero) dell'anno di fine stagione
  // Date constructor (year, monthIndex, day) -> August is 7.
  const expiryDate = new Date(endYear, 7, 31, 23, 59, 59, 999);

  return {
    seasonStartYear: startYear,
    seasonEndYear: endYear,
    expiryDate,
  };
}

/**
 * Generates the physical Membership Number string.
 * Format: [YY][YY]-[XXXX]
 * Example: 2024-2025 with ID 123 -> "2425-0123"
 */
export function generateMembershipNumber(
  memberId: number,
  seasonStartYear: number,
  seasonEndYear: number
): string {
  if (!memberId || !seasonStartYear || !seasonEndYear) {
    throw new Error("Missing required parameters for generateMembershipNumber");
  }

  const startYY = seasonStartYear.toString().slice(-2);
  const endYY = seasonEndYear.toString().slice(-2);
  const paddedId = memberId.toString().padStart(4, "0");

  return `${startYY}${endYY}-${paddedId}`;
}

/**
 * Generates the Barcode equivalent of a Membership Number.
 * Format: "T" + membershipNumber without hyphens.
 */
export function generateBarcode(membershipNumber: string): string {
  if (!membershipNumber) {
    throw new Error("Invalid membershipNumber provided for generateBarcode");
  }
  return `T${membershipNumber.replace(/-/g, "")}`;
}

/**
 * Common builder for establishing the required fields of a new membership Insert schema.
 * Operates purely on provided data and rules.
 */
export function buildMembershipPayload(
  memberId: number,
  membershipType: "NUOVO" | "RINNOVO",
  seasonCompetence: "CORRENTE" | "SUCCESSIVA",
  issueDate: Date,
  fee: string | number = 25
): any {
  if (!memberId || !membershipType || !seasonCompetence || !issueDate) {
    throw new Error("Missing required parameters for building membership payload");
  }

  // 1. Resolve Season & Expiry
  const seasonBounds = resolveMembershipSeason(issueDate, seasonCompetence);

  // 2. Generate Membership Number
  const membershipNumber = generateMembershipNumber(
    memberId,
    seasonBounds.seasonStartYear,
    seasonBounds.seasonEndYear
  );

  // 3. Generate Barcode
  const barcode = generateBarcode(membershipNumber);

  // 4. Return the assembled payload for the insert schema
  return {
    memberId,
    membershipType,
    seasonCompetence,
    seasonStartYear: seasonBounds.seasonStartYear,
    seasonEndYear: seasonBounds.seasonEndYear,
    issueDate,
    expiryDate: seasonBounds.expiryDate,
    membershipNumber,
    barcode,
    entityCardNumber: "Libertas", // Default entity
    fee: fee.toString(),
    active: true,
    // Add the legacy renewalType for backward compatibility until dropped
    renewalType: membershipType.toLowerCase() as "nuovo" | "rinnovo",
  };
}
