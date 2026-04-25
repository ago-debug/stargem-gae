const fs = require('fs');

const path = 'client/src/pages/members.tsx';
let content = fs.readFileSync(path, 'utf8');

// Aggiungi l'import
content = content.replace(
  /import { User, Users, /g, 
  "import { ExportWizard } from \"@/components/ExportWizard\";\nimport { User, Users, "
);

// Sostituisci il bottone
const btnTarget = /<Button\s+variant="outline"\s+onClick=\{exportToCSV\}\s+data-testid="button-export-csv"\s*>\s*<Download className="w-4 h-4 mr-2" \/>\s*Esporta CSV\s*<\/Button>/g;

const wizardCode = `          <ExportWizard 
            filename="anagrafica"
            title="Esporta Anagrafica"
            apiEndpoint="/api/export"
            apiParams={{ 
              table: 'members',
              filters: {
                search: searchQuery,
                status: statusFilter,
                gender: genderFilter,
                hasMedicalCert: hasMedicalCertFilter,
                isMinor: isMinorFilter,
                participantType: participantTypeFilter,
                hasCard: hasCardFilter,
                hasEntityCard: hasEntityCardFilter,
                hasEmail: hasEmailFilter,
                hasPhone: hasPhoneFilter,
                missingFiscalCode: missingFiscalCodeFilter,
                issuesFilter: issuesFilter
              }
            }}
            columns={[
              { key: 'lastName', label: 'Cognome', default: true },
              { key: 'firstName', label: 'Nome', default: true },
              { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
              { key: 'email', label: 'Email', default: true },
              { key: 'phone', label: 'Telefono', default: true },
              { key: 'cardNumber', label: 'Tessera', default: true },
              { key: 'hasMedicalCertificate', label: 'Cert. Medico', default: true },
              { key: 'dateOfBirth', label: 'Data di Nascita' },
              { key: 'placeOfBirth', label: 'Luogo Nascita' },
              { key: 'city', label: 'Città' },
              { key: 'province', label: 'Provincia' }
            ]}
          />`;

content = content.replace(btnTarget, wizardCode);

fs.writeFileSync(path, content);
