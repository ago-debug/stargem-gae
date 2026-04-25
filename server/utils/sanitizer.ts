export function toTitleCase(str: string): string {
  if (!str) return str;
  const titleCased = str.split(/(\s+|-|')/).map(word => {
    if (word.trim() === '' || word === '-' || word === "'") return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');

  let result = '';
  for (let i = 0; i < titleCased.length; i++) {
    const char = titleCased[i];
    if (i > 0) {
      const prevChar = titleCased[i - 1];
      if ((/[0-9\/]/.test(prevChar)) && /[a-z]/.test(char)) {
        result += char.toUpperCase();
        continue;
      }
    }
    result += char;
  }
  return result;
}

export function sanitizeMemberData<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  const upperFields = [
    'lastName', 'firstName', 'fiscalCode', 'city', 'province', 
    'region', 'nationality', 'birthPlace', 'alboNumero', 'carPlate'
  ];
  
  const lowerFields = [
    'email', 'secondaryEmail', 'emailPec', 'socialFacebook', 'website'
  ];
  
  const titleFields = [
    'address', 'profession', 'educationTitle', 'bankName', 
    'motherLastName', 'motherFirstName', 'fatherLastName', 'fatherFirstName', 
    'tutor1LastName', 'tutor1FirstName', 'tutor2LastName', 'tutor2FirstName', 
    'guardianLastName', 'guardianFirstName',
    'emergencyContact1Name', 'emergencyContact2Name', 'emergencyContact3Name',
    'emergencyContactName'
  ];

  const sanitized: Record<string, any> = { ...data };

  // First TRIM all string fields
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
  }

  // UPPERCASE
  for (const field of upperFields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].toUpperCase();
    }
  }

  // LOWERCASE
  for (const field of lowerFields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].toLowerCase();
    }
  }

  // TITLE CASE
  for (const field of titleFields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = toTitleCase(sanitized[field]);
    }
  }

  return sanitized as T;
}
