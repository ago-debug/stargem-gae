const fs = require('fs');

const path = 'client/src/pages/members.tsx';
let content = fs.readFileSync(path, 'utf8');

const newColumns = `            expandable={true}
            columns={[
              // PRINCIPALI (default true)
              { key: 'id', label: 'ID Database', default: true },
              { key: 'lastName', label: 'Cognome', default: true },
              { key: 'firstName', label: 'Nome', default: true },
              { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
              { key: 'email', label: 'Email', default: true },
              { key: 'phone', label: 'Telefono', default: true },
              { key: 'mobile', label: 'Cellulare', default: true },
              { key: 'cardNumber', label: 'Numero Tessera', default: true },
              { key: 'hasMedicalCertificate', label: 'Certificato Medico', default: true },
              { key: 'dateOfBirth', label: 'Data di Nascita', default: true },
              { key: 'city', label: 'Città', default: true },
              
              // CONTATTI (default false)
              { key: 'secondaryEmail', label: 'Email Secondaria', default: false },
              { key: 'emailPec', label: 'PEC', default: false },
              { key: 'whatsapp', label: 'WhatsApp', default: false },
              { key: 'address', label: 'Indirizzo', default: false },
              { key: 'postalCode', label: 'CAP', default: false },
              { key: 'province', label: 'Provincia', default: false },
              { key: 'region', label: 'Regione', default: false },
              
              // DATI EXTRA (default false)
              { key: 'nationality', label: 'Nazionalità', default: false },
              { key: 'profession', label: 'Professione', default: false },
              { key: 'educationTitle', label: 'Titolo di Studio', default: false },
              { key: 'documentType', label: 'Tipo Documento', default: false },
              { key: 'bankName', label: 'Banca', default: false },
              { key: 'iban', label: 'IBAN', default: false },
              { key: 'sizeShirt', label: 'Taglia Maglia', default: false },
              { key: 'sizePants', label: 'Taglia Pantaloni', default: false },
              { key: 'sizeShoes', label: 'Taglia Scarpe', default: false },
              { key: 'height', label: 'Altezza', default: false },
              { key: 'weight', label: 'Peso', default: false },
              
              // TUTORI (default false)
              { key: 'tutor1FiscalCode', label: 'CF Tutore 1', default: false },
              { key: 'tutor1Phone', label: 'Telefono Tutore 1', default: false },
              { key: 'tutor1Email', label: 'Email Tutore 1', default: false },
              
              // ADMIN (default false)
              { key: 'dataQualityFlag', label: 'Data Quality Flag', default: false },
              { key: 'fromWhere', label: 'Origine Dato', default: false },
              { key: 'athenaId', label: 'ID Athena', default: false },
              { key: 'fatturaFatta', label: 'Fattura Emessa', default: false },
              { key: 'createdAt', label: 'Data Creazione', default: false },
              { key: 'updatedAt', label: 'Ultima Modifica', default: false }
            ]}`;

const regex = /columns=\{\[\s*\{\s*key:\s*'id'.*?\}\s*\]\}/s;
content = content.replace(regex, newColumns);
fs.writeFileSync(path, content);
console.log('patched');
