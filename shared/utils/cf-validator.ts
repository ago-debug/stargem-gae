export function validateCF(cf: string) {
  if (!cf || cf.length !== 16) {
    return { isValid: false, error: 'Lunghezza errata (deve essere 16 caratteri)' };
  }
  const upperCf = cf.toUpperCase();
  if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(upperCf)) {
    return { isValid: false, error: 'Formato alfanumerico errato' };
  }

  const setOdd = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  };
  const setEven = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  };

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = upperCf[i];
    if (i % 2 === 0) {
      // Dispari (indice 0, 2, 4...)
      sum += setOdd[char as keyof typeof setOdd];
    } else {
      // Pari (indice 1, 3, 5...)
      sum += setEven[char as keyof typeof setEven];
    }
  }

  const remainder = sum % 26;
  const checkChar = String.fromCharCode(remainder + 65);
  if (checkChar !== upperCf[15]) {
    return { isValid: false, error: 'Carattere di controllo (checksum) errato' };
  }

  // Estrazione dati
  const yearStr = upperCf.substring(6, 8);
  const monthChar = upperCf.charAt(8);
  const dayStr = upperCf.substring(9, 11);
  
  const monthMap: Record<string, string> = {
    'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06', 
    'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
  };
  const month = monthMap[monthChar] || '01';
  
  let dayNum = parseInt(dayStr, 10);
  const gender = dayNum > 40 ? 'F' : 'M';
  if (gender === 'F') {
    dayNum -= 40;
  }
  
  const currentYear2Digits = new Date().getFullYear() % 100;
  const yearNum = parseInt(yearStr, 10);
  const century = yearNum > currentYear2Digits + 5 ? '19' : '20';
  const fullYear = century + yearStr;
  const fullDay = dayNum.toString().padStart(2, '0');
  
  const computedDob = `${fullYear}-${month}-${fullDay}`;
  const computedSurnameCodes = upperCf.substring(0, 3);
  const computedNameCodes = upperCf.substring(3, 6);

  return {
    isValid: true,
    computedGender: gender,
    computedDob,
    computedSurnameCodes,
    computedNameCodes,
    error: null
  };
}
