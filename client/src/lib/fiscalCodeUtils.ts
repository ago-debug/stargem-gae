/**
 * Utility per validazione e parsing del Codice Fiscale italiano
 */

const MONTHS = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];

const ODD_VALUES: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const EVEN_VALUES: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

const CONTROL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface FiscalCodeData {
  dateOfBirth: string;
  gender: 'M' | 'F';
  placeOfBirth?: string;
}

/**
 * Valida il formato del codice fiscale
 */
export function validateFiscalCodeFormat(fiscalCode: string): boolean {
  if (!fiscalCode || typeof fiscalCode !== 'string') return false;

  const normalized = fiscalCode.toUpperCase().trim();

  const pattern = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

  return pattern.test(normalized);
}

/**
 * Calcola il carattere di controllo
 */
function calculateControlChar(fiscalCode: string): string {
  const code = fiscalCode.substring(0, 15).toUpperCase();
  let sum = 0;

  for (let i = 0; i < 15; i++) {
    const char = code[i];
    const isOdd = i % 2 === 0;

    if (isOdd) {
      sum += ODD_VALUES[char] || 0;
    } else {
      sum += EVEN_VALUES[char] || 0;
    }
  }

  return CONTROL_CHARS[sum % 26];
}

/**
 * Valida il codice fiscale includendo il controllo del carattere di verifica
 */
export function validateFiscalCode(fiscalCode: string): boolean {
  if (!validateFiscalCodeFormat(fiscalCode)) return false;

  const normalized = fiscalCode.toUpperCase().trim();
  const controlChar = calculateControlChar(normalized);

  return controlChar === normalized[15];
}

/**
 * Estrae i dati dal codice fiscale
 */
export function parseFiscalCode(fiscalCode: string): FiscalCodeData | null {
  if (!validateFiscalCode(fiscalCode)) return null;

  const normalized = fiscalCode.toUpperCase().trim();

  try {
    let year = parseInt(normalized.substring(6, 8));
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const lastTwoDigits = currentYear % 100;

    if (year > lastTwoDigits) {
      year += currentCentury - 100;
    } else {
      year += currentCentury;
    }

    const monthChar = normalized[8];
    const monthIndex = MONTHS.indexOf(monthChar);
    if (monthIndex === -1) return null;
    const month = monthIndex + 1;

    let day = parseInt(normalized.substring(9, 11));
    let gender: 'M' | 'F' = 'M';

    if (day > 40) {
      gender = 'F';
      day -= 40;
    }

    const dateOfBirth = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const placeCode = normalized.substring(11, 15);

    return {
      dateOfBirth,
      gender,
      placeOfBirth: placeCode
    };
  } catch (error) {
    console.error('Errore nel parsing del codice fiscale:', error);
    return null;
  }
}

/**
 * Dizionario dei comuni italiani più comuni (codice catastale -> nome)
 */
/**
 * Dizionario dei comuni italiani più comuni (codice catastale -> nome|provincia)
 */
const COMMON_CITIES: Record<string, string> = {
  'A001': 'Abano Terme|PD',
  'A015': 'Abbiategrasso|MI',
  'A087': 'Acerra|NA',
  'A182': 'Agrigento|AG',
  'A225': 'Albano Laziale|RM',
  'A326': 'Alessandria|AL',
  'A336': 'Alfonsine|RA',
  'A345': 'Alghero|SS',
  'A462': 'Ancona|AN',
  'A479': 'Andria|BT',
  'A547': 'Anzio|RM',
  'A565': 'Aosta|AO',
  'A594': 'Aprilia|LT',
  'A662': 'Arezzo|AR',
  'A669': 'Ariccia|RM',
  'A717': 'Arzignano|VI',
  'A794': 'Ascoli Piceno|AP',
  'A859': 'Asti|AT',
  'B354': 'Bari|BA',
  'B519': 'Barletta|BT',
  'B963': 'Bergamo|BG',
  'C351': 'Bologna|BO',
  'C523': 'Bolzano|BZ',
  'D612': 'Firenze|FI',
  'F205': 'Milano|MI',
  'G273': 'Napoli|NA',
  'H501': 'Roma|RM',
  'I304': 'Torino|TO',
  'L736': 'Venezia|VE',
};

/**
 * Converte il codice catastale in nome del comune
 */
export function getPlaceName(placeCode: string): string | null {
  const place = COMMON_CITIES[placeCode];
  return place ? place.split('|')[0] : null;
}

/**
 * Restituisce dettagli del luogo (città e provincia)
 */
export function getPlaceDetails(placeCode: string): { city: string; province: string } | null {
  const place = COMMON_CITIES[placeCode];
  if (!place) return null;
  const [city, province] = place.split('|');
  return { city, province };
}

/**
 * Calcola l'età dalla data di nascita (formato YYYY-MM-DD)
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
