/**
 * Genera il numero tessera nel formato: [stagione 4 cifre][member_id 6 cifre]
 * Esempio: seasonCode='2526', memberId=42 → '2526000042'
 */
export function generateMembershipNumber(
  seasonCode: string,
  memberId: number
): string {
  return `${seasonCode}-${String(memberId).padStart(6, '0')}`;
}

/**
 * Calcola la data di scadenza tessera dal codice stagione.
 * La tessera scade SEMPRE il 31 agosto della stagione di competenza.
 * Esempio: seasonCode='2526' → endYear=2026 → 2026-08-31
 */
export function calculateMembershipExpiry(seasonCode: string): Date {
  const endYear = 2000 + parseInt(seasonCode.slice(2, 4), 10);
  return new Date(`${endYear}-08-31`);
}

/**
 * Ricava il seasonCode (es. '2526') dall'ID stagione.
 * season_start_year e season_end_year vengono passati come parametri.
 */
export function seasonToCode(
  startYear: number,
  endYear: number
): string {
  return `${String(startYear).slice(2)}${String(endYear).slice(2)}`;
}
