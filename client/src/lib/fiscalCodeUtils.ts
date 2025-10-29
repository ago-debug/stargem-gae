/**
 * Utility per validazione e parsing del Codice Fiscale italiano
 */

const MONTHS = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
const CONTROL_CODE_ODD = '1-0-5-7-9-13-15-17-19-21-1-0-5-7-9-13-15-17-19-21-1-0-5-7-9'.split('-');
const CONTROL_CODE_EVEN = '0-1-2-3-4-5-6-7-8-9-0-1-2-3-4-5-6-7-8-9-0-1-2-3-4-5'.split('-');

interface FiscalCodeData {
  dateOfBirth: string; // formato YYYY-MM-DD
  gender: 'M' | 'F';
  placeOfBirth?: string; // codice catastale
}

/**
 * Valida il formato del codice fiscale
 */
export function validateFiscalCodeFormat(fiscalCode: string): boolean {
  if (!fiscalCode || typeof fiscalCode !== 'string') return false;
  
  const normalized = fiscalCode.toUpperCase().trim();
  
  // Formato: 6 lettere + 2 cifre + lettera + 2 cifre + lettera + 3 cifre + lettera
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
      // Posizione dispari (1, 3, 5, ...)
      if (char >= '0' && char <= '9') {
        sum += parseInt(CONTROL_CODE_ODD[parseInt(char)]);
      } else {
        sum += parseInt(CONTROL_CODE_ODD[char.charCodeAt(0) - 'A'.charCodeAt(0) + 10]);
      }
    } else {
      // Posizione pari (2, 4, 6, ...)
      if (char >= '0' && char <= '9') {
        sum += parseInt(char);
      } else {
        sum += char.charCodeAt(0) - 'A'.charCodeAt(0);
      }
    }
  }
  
  return String.fromCharCode('A'.charCodeAt(0) + (sum % 26));
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
    // Estrai anno (posizioni 6-7)
    let year = parseInt(normalized.substring(6, 8));
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const lastTwoDigits = currentYear % 100;
    
    // Determina il secolo
    if (year > lastTwoDigits) {
      year += currentCentury - 100; // secolo precedente
    } else {
      year += currentCentury; // secolo attuale
    }
    
    // Estrai mese (posizione 8)
    const monthChar = normalized[8];
    const monthIndex = MONTHS.indexOf(monthChar);
    if (monthIndex === -1) return null;
    const month = monthIndex + 1;
    
    // Estrai giorno e sesso (posizioni 9-10)
    let day = parseInt(normalized.substring(9, 11));
    let gender: 'M' | 'F' = 'M';
    
    if (day > 40) {
      gender = 'F';
      day -= 40;
    }
    
    // Formatta la data in YYYY-MM-DD
    const dateOfBirth = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Codice catastale (posizioni 11-14)
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
 * Questo è un subset ridotto - in produzione usare un database completo
 */
const COMMON_CITIES: Record<string, string> = {
  'A001': 'Abano Terme',
  'A015': 'Abbiategrasso',
  'A087': 'Acerra',
  'A182': 'Agrigento',
  'A225': 'Albano Laziale',
  'A326': 'Alessandria',
  'A336': 'Alfonsine',
  'A345': 'Alghero',
  'A462': 'Ancona',
  'A479': 'Andria',
  'A547': 'Anzio',
  'A565': 'Aosta',
  'A594': 'Aprilia',
  'A662': 'Arezzo',
  'A669': 'Ariccia',
  'A717': 'Arzignano',
  'A794': 'Ascoli Piceno',
  'A859': 'Asti',
  'B354': 'Bari',
  'B519': 'Barletta',
  'B963': 'Bergamo',
  'C351': 'Bologna',
  'C523': 'Bolzano',
  'D612': 'Firenze',
  'F205': 'Milano',
  'G273': 'Napoli',
  'H501': 'Roma',
  'I304': 'Torino',
  'L736': 'Venezia',
};

/**
 * Converte il codice catastale in nome del comune
 */
export function getPlaceName(placeCode: string): string | null {
  return COMMON_CITIES[placeCode] || null;
}
