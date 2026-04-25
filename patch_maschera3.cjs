const fs = require('fs');

const path = 'client/src/pages/maschera-input-generale.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<ExportWizard\s+filename="membro"[\s\S]*?\]\}\s*\/>/m;

const replacement = `
              <ExportWizard 
                filename={currentMember?.lastName && currentMember?.firstName ? \`\${currentMember.lastName}_\${currentMember.firstName}\` : 'membro'}
                title="Esporta Membro"
                data={currentMember ? [{
                  ...currentMember,
                  membershipNumber: bottomSectionsData.tessere.numero || topTesseraNumero,
                  membershipExpiry: bottomSectionsData.tessere.dataScad || (topTesseraMembership ? topTesseraMembership.expiryDate : ''),
                  membershipStatus: bottomSectionsData.tessere.dataScad ? (new Date(bottomSectionsData.tessere.dataScad) > new Date() ? 'ATTIVA' : 'SCADUTA') : (topTesseraMembership ? (new Date(topTesseraMembership.expiryDate) > new Date() ? 'ATTIVA' : 'SCADUTA') : ''),
                  lastPaymentAmount: combinedPayments && combinedPayments.length > 0 ? [...combinedPayments].sort((a, b) => new Date(b.dataPagamento || b.createdAt).getTime() - new Date(a.dataPagamento || a.createdAt).getTime())[0].importo : '',
                  lastPaymentDate: combinedPayments && combinedPayments.length > 0 ? [...combinedPayments].sort((a, b) => new Date(b.dataPagamento || b.createdAt).getTime() - new Date(a.dataPagamento || a.createdAt).getTime())[0].dataPagamento : '',
                  medicalCertExpiry: bottomSectionsData.certificatoMedico.dataScadenza || (formData && formData.scadenzaCertificatoMedico ? formData.scadenzaCertificatoMedico : ''),
                  medicalCertStatus: bottomSectionsData.certificatoMedico.dataScadenza ? (new Date(bottomSectionsData.certificatoMedico.dataScadenza) > new Date() ? 'VALIDO' : 'SCADUTO') : ((formData && formData.scadenzaCertificatoMedico) ? (new Date(formData.scadenzaCertificatoMedico) > new Date() ? 'VALIDO' : 'SCADUTO') : '')
                }] : []}
                expandable={true}
                columns={[
                  { key: 'id', label: 'ID Database', default: true },
                  { key: 'lastName', label: 'Cognome', default: true },
                  { key: 'firstName', label: 'Nome', default: true },
                  { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
                  { key: 'email', label: 'Email', default: true },
                  { key: 'phone', label: 'Telefono', default: true },
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
