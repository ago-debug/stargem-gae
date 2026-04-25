const fs = require('fs');
const path = 'client/src/pages/members.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ ADMIN \(default false\)/;
const replacement = `// DATI EXTRA AGGIUNTIVI (default false)
              { key: 'pIva', label: 'Partita IVA', default: false },
              { key: 'alboTipo', label: 'Albo Tipo', default: false },
              { key: 'alboNumero', label: 'N. Albo', default: false },
              { key: 'alboDataIscrizione', label: 'Data Iscrizione Albo', default: false },
              { key: 'patenteTipo', label: 'Tipo Patente', default: false },
              { key: 'patentePendere', label: 'Patente Scadenza', default: false },
              { key: 'carPlate', label: 'Targa', default: false },
              { key: 'tutor2FirstName', label: 'Nome Tutore 2', default: false },
              { key: 'tutor2LastName', label: 'Cognome Tutore 2', default: false },
              { key: 'tutor2BirthDate', label: 'Data Nascita Tutore 2', default: false },
              { key: 'emergencyContact1Name', label: 'Contatto Emergenza 1', default: false },
              { key: 'emergencyContact1Phone', label: 'Tel. Emergenza 1', default: false },
              { key: 'emergencyContact2Name', label: 'Contatto Emergenza 2', default: false },
              { key: 'emergencyContact2Phone', label: 'Tel. Emergenza 2', default: false },
              { key: 'socialFacebook', label: 'Facebook', default: false },
              { key: 'website', label: 'Sito Web', default: false },
              { key: 'placeOfBirth', label: 'Luogo Nascita', default: false },
              { key: 'gender', label: 'Sesso', default: false },
              { key: 'participantType', label: 'Tipo Partecipante', default: false },
              { key: 'status', label: 'Stato', default: false },
              { key: 'previousMembershipNumber', label: 'Tessera Precedente', default: false },
              
              // ADMIN (default false)`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('patched');
