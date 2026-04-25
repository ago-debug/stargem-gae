const fs = require('fs');

const path = 'client/src/pages/maschera-input-generale.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<ExportWizard\s+filename="membro"[\s\S]*?\]\}\s*\/>/m;

const replacement = `
              <ExportWizard 
                filename="membro"
                title="Esporta Membro"
                data={formData ? [{
                  ...formData,
                  membershipNumber: bottomSectionsData.tessere.numero,
                  membershipExpiry: bottomSectionsData.tessere.dataScad,
                  membershipStatus: bottomSectionsData.tessere.dataScad ? (new Date(bottomSectionsData.tessere.dataScad) > new Date() ? 'ATTIVA' : 'SCADUTA') : '',
                  lastPaymentAmount: combinedPayments && combinedPayments.length > 0 ? [...combinedPayments].sort((a, b) => new Date(b.dataPagamento || b.createdAt).getTime() - new Date(a.dataPagamento || a.createdAt).getTime())[0].importo : '',
                  lastPaymentDate: combinedPayments && combinedPayments.length > 0 ? [...combinedPayments].sort((a, b) => new Date(b.dataPagamento || b.createdAt).getTime() - new Date(a.dataPagamento || a.createdAt).getTime())[0].dataPagamento : '',
                  medicalCertExpiry: bottomSectionsData.certificatoMedico.dataScadenza,
                  medicalCertStatus: bottomSectionsData.certificatoMedico.dataScadenza ? (new Date(bottomSectionsData.certificatoMedico.dataScadenza) > new Date() ? 'VALIDO' : 'SCADUTO') : '',
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

content = content.replace(regex, replacement.trim());
fs.writeFileSync(path, content);
console.log('patched');
