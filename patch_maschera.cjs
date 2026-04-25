const fs = require('fs');

const path = 'client/src/pages/maschera-input-generale.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
              <ExportWizard 
                filename="membro"
                title="Esporta Membro"
                data={formData ? [{
                  ...formData,
                  membershipNumber: bottomSectionsData.tessere.numero,
                  membershipExpiry: bottomSectionsData.tessere.scadenza,
                  membershipStatus: bottomSectionsData.tessere.scadenza ? (new Date(bottomSectionsData.tessere.scadenza) > new Date() ? 'ATTIVA' : 'SCADUTA') : '',
                  lastPaymentAmount: bottomSectionsData.quote.importoRicevuto,
                  lastPaymentDate: bottomSectionsData.quote.dataAcconto,
                  medicalCertExpiry: bottomSectionsData.certificati.scadenza,
                  medicalCertStatus: bottomSectionsData.certificati.scadenza ? (new Date(bottomSectionsData.certificati.scadenza) > new Date() ? 'VALIDO' : 'SCADUTO') : '',
                }] : []}
                expandable={true}
                columns={[
                  { key: 'id', label: 'ID Database', default: true },
                  { key: 'cognome', label: 'Cognome', default: true },
                  { key: 'nome', label: 'Nome', default: true },
                  { key: 'codiceFiscale', label: 'Codice Fiscale', default: true },
                  { key: 'email', label: 'Email', default: true },
                  { key: 'telefono', label: 'Telefono', default: true },
                  { key: 'membershipNumber', label: 'Numero Tessera', default: true },
                  { key: 'membershipExpiry', label: 'Scadenza Tessera', default: true },
                  { key: 'membershipStatus', label: 'Stato Tessera', default: true },
                  { key: 'lastPaymentAmount', label: 'Importo Ultimo Pagamento', default: false },
                  { key: 'lastPaymentDate', label: 'Data Ultimo Pagamento', default: false },
                  { key: 'medicalCertExpiry', label: 'Scadenza Certificato', default: false },
                  { key: 'medicalCertStatus', label: 'Stato Certificato', default: false }
                ]}
              />
`;

const regex = /<ExportWizard\s+filename="membro"[\s\S]*?\]\}\s*\/>/m;
content = content.replace(regex, replacement.trim());
fs.writeFileSync(path, content);
console.log('patched');
