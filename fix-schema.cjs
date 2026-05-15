const fs = require('fs');

const file = 'shared/schema.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace tutor1 with genitore1
content = content.replace(/tutor1FirstName: varchar\("tutor1_first_name"/g, 'genitore1FirstName: varchar("genitore1_first_name"');
content = content.replace(/tutor1LastName: varchar\("tutor1_last_name"/g, 'genitore1LastName: varchar("genitore1_last_name"');
content = content.replace(/tutor1FiscalCode: varchar\("tutor1_fiscal_code"/g, 'genitore1FiscalCode: varchar("genitore1_fiscal_code"');

// Wait, tutor1BirthDate etc are around line 713
content = content.replace(/tutor1BirthDate: date\("tutor1_birth_date"\),/g, 'genitore1BirthDate: date("genitore1_birth_date"),');
content = content.replace(/tutor1BirthPlace: varchar\("tutor1_birth_place"/g, 'genitore1BirthPlace: varchar("genitore1_birth_place"');
content = content.replace(/tutor1Phone: varchar\("tutor1_phone"/g, 'genitore1Phone: varchar("genitore1_phone"');
content = content.replace(/tutor1Email: varchar\("tutor1_email"/g, 'genitore1Email: varchar("genitore1_email"');

// Add the missing genitore1 fields right after genitore1Email
content = content.replace(/genitore1Email: varchar\("genitore1_email", \{ length: 255 \}\),/g, 
  'genitore1Email: varchar("genitore1_email", { length: 255 }),\n  genitore1Mobile: varchar("genitore1_mobile", { length: 50 }),\n  genitore1Address: varchar("genitore1_address", { length: 255 }),\n  genitore1City: varchar("genitore1_city", { length: 100 }),\n  genitore1Province: varchar("genitore1_province", { length: 2 }),\n  genitore1PostalCode: varchar("genitore1_postal_code", { length: 10 }),');

// Rename tutor2 to genitore2
content = content.replace(/tutor2FirstName: varchar\("tutor2_first_name"/g, 'genitore2FirstName: varchar("genitore2_first_name"');
content = content.replace(/tutor2LastName: varchar\("tutor2_last_name"/g, 'genitore2LastName: varchar("genitore2_last_name"');
content = content.replace(/tutor2BirthDate: date\("tutor2_birth_date"\),/g, 'genitore2BirthDate: date("genitore2_birth_date"),');
content = content.replace(/tutor2BirthPlace: varchar\("tutor2_birth_place"/g, 'genitore2BirthPlace: varchar("genitore2_birth_place"');

content = content.replace(/tutor2FiscalCode: varchar\("tutor2_fiscal_code"/g, 'genitore2FiscalCode: varchar("genitore2_fiscal_code"');
content = content.replace(/tutor2Phone: varchar\("tutor2_phone"/g, 'genitore2Phone: varchar("genitore2_phone"');
content = content.replace(/tutor2Email: varchar\("tutor2_email"/g, 'genitore2Email: varchar("genitore2_email"');

// Add the missing genitore2 fields right after genitore2Email
content = content.replace(/genitore2Email: varchar\("genitore2_email", \{ length: 255 \}\),/g, 
  'genitore2Email: varchar("genitore2_email", { length: 255 }),\n  genitore2Mobile: varchar("genitore2_mobile", { length: 50 }),\n  genitore2Address: varchar("genitore2_address", { length: 255 }),\n  genitore2City: varchar("genitore2_city", { length: 100 }),\n  genitore2Province: varchar("genitore2_province", { length: 2 }),\n  genitore2PostalCode: varchar("genitore2_postal_code", { length: 10 }),');

// Add last_renewal_date near firstEnrollmentDate
content = content.replace(/firstEnrollmentDate: date\("first_enrollment_date"\),/g, 'firstEnrollmentDate: date("first_enrollment_date"),\n  lastRenewalDate: date("last_renewal_date"),');

// Remove mother/father lines
const motherFatherRegex = /\s*(mother|father)[A-Za-z0-9]+:.*,/g;
content = content.replace(motherFatherRegex, '');

// Remove bio, specialization, hourly_rate
const staffRegex = /\s*(bio|specialization): text\([^)]*\),/g;
content = content.replace(staffRegex, '');
content = content.replace(/\s*hourlyRate: decimal\([^)]*\),/g, '');

// Remove residence_permit
content = content.replace(/\s*residencePermit.*,/g, '');
content = content.replace(/\s*residencePermitExpiry.*,/g, '');

fs.writeFileSync(file, content);
console.log('Schema updated.');
