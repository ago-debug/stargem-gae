const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  const [rows] = await connection.execute('SELECT * FROM members');

  const upperFields = ['last_name', 'first_name', 'fiscal_code', 'city', 'province', 'region', 'nationality', 'place_of_birth', 'albo_number', 'car_plate'];
  const lowerFields = ['email', 'secondary_email', 'email_pec', 'social_facebook', 'website'];
  const titleFields = ['address', 'street_address', 'profession', 'education_institute', 'education_title', 'bank_name', 'tutor1_last_name', 'tutor1_first_name', 'tutor2_last_name', 'tutor2_first_name', 'emergency_contact1_name', 'emergency_contact2_name'];

  function toTitleCase(str) {
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

  let changedCount = 0;
  const sample = [];

  for (const row of rows) {
    let changed = false;
    const originalRow = { ...row };

    for (const field of upperFields) {
      if (row[field] && typeof row[field] === 'string') {
        const newVal = row[field].trim().toUpperCase();
        if (newVal !== row[field]) {
          row[field] = newVal;
          changed = true;
        }
      }
    }

    for (const field of lowerFields) {
      if (row[field] && typeof row[field] === 'string') {
        const newVal = row[field].trim().toLowerCase();
        if (newVal !== row[field]) {
          row[field] = newVal;
          changed = true;
        }
      }
    }

    for (const field of titleFields) {
      if (row[field] && typeof row[field] === 'string') {
        const newVal = toTitleCase(row[field].trim());
        if (newVal !== row[field]) {
          row[field] = newVal;
          changed = true;
        }
      }
    }

    if (changed) {
      changedCount++;
      if (sample.length < 5) {
        sample.push({ original: originalRow, updated: row });
      }
    }
  }

  console.log('--- DRY RUN NORMALIZZAZIONE ---');
  console.log(`Totale record che verrebbero modificati: ${changedCount} su ${rows.length}`);
  console.log('\n--- CAMPIONE 5 RECORD ---');
  sample.forEach((s, i) => {
    console.log(`\nRECORD (ID: ${s.original.id})`);
    for (const key of [...upperFields, ...lowerFields, ...titleFields]) {
      if (s.original[key] !== s.updated[key]) {
        console.log(`- ${key}:`);
        console.log(`  Prima: "${s.original[key]}"`);
        console.log(`  Dopo:  "${s.updated[key]}"`);
      }
    }
  });

  await connection.end();
}

main().catch(console.error);
