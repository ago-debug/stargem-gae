export function validatePhone(phone: string | null | undefined): { valid: boolean; formatted: string | null; error: string | null } {
  if (!phone) {
    return { valid: true, formatted: null, error: null }; // Empty is technically not malformed
  }

  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle double prefix +39+39 or 3939
  if (cleaned.startsWith('+39+39')) {
    cleaned = cleaned.replace('+39+39', '+39');
  } else if (cleaned.startsWith('3939')) {
    cleaned = '+39' + cleaned.substring(4);
  } else if (cleaned.startsWith('39') && cleaned.length > 10 && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('0039')) {
    cleaned = '+39' + cleaned.substring(4);
  } else if (!cleaned.startsWith('+') && cleaned.length >= 9) {
    // Assume +39 if missing and looks like Italian mobile (starts with 3)
    if (cleaned.startsWith('3')) {
      cleaned = '+39' + cleaned;
    }
  }

  // Remove double zero if after +39
  if (cleaned.startsWith('+3900')) {
    cleaned = '+39' + cleaned.substring(5);
  }

  const isItalian = cleaned.startsWith('+39');
  const numbersOnly = cleaned.replace(/[^\d]/g, '');

  if (isItalian) {
    const withoutPrefix = numbersOnly.substring(2);
    const isMobile = withoutPrefix.startsWith('3');
    
    if (isMobile) {
      if (withoutPrefix.length !== 10) {
        return { valid: false, formatted: formatPhone(cleaned), error: `Cellulare italiano errato (${withoutPrefix.length} cifre invece di 10)` };
      }
    } else {
      if (withoutPrefix.length < 5 || withoutPrefix.length > 11) {
        return { valid: false, formatted: formatPhone(cleaned), error: `Fisso italiano errato (${withoutPrefix.length} cifre)` };
      }
    }
  } else {
    // International or unknown
    if (numbersOnly.length < 7 || numbersOnly.length > 15) {
      return { valid: false, formatted: formatPhone(cleaned), error: `Numero internazionale anomalo (${numbersOnly.length} cifre)` };
    }
  }

  return { valid: true, formatted: formatPhone(cleaned), error: null };
}

export function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+39')) {
    const withoutPrefix = cleaned.substring(3);
    if (withoutPrefix.startsWith('3') && withoutPrefix.length === 10) {
      // Mobile
      return `+39 ${withoutPrefix.substring(0, 3)} ${withoutPrefix.substring(3, 6)} ${withoutPrefix.substring(6)}`;
    } else {
      // Landline or other
      return `+39 ${withoutPrefix}`;
    }
  }
  
  return cleaned;
}
