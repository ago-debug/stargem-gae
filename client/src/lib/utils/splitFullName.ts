export function splitFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };

  // Common italian/international last name prefixes
  const prefixes = ['de', 'di', 'del', 'della', 'delle', 'delli', 'dello', 'da', 'dalla', 'dalle', 'dallo', 'van', 'von', 'der', 'den', 'ten', 'ter', 'la', 'lo', 'le', "d'"];

  let splitIndex = parts.length - 1; // Default: last word is last name

  const secondToLast = parts[parts.length - 2].toLowerCase();
  if (prefixes.includes(secondToLast)) {
    splitIndex = parts.length - 2;
    if (parts.length > 2) {
      const thirdToLast = parts[parts.length - 3].toLowerCase();
      if (prefixes.includes(thirdToLast)) {
        splitIndex = parts.length - 3;
      }
    }
  }

  const firstName = parts.slice(0, splitIndex).join(' ');
  const lastName = parts.slice(splitIndex).join(' ');

  return { firstName, lastName };
}
