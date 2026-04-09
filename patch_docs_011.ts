import fs from 'fs';

const gaePath = './_GAE_SVILUPPO/00A_GAE_ULTIMI_AGGIORNAMENTI.md';
let gae = fs.readFileSync(gaePath, 'utf8');

const updateLog = `
---
Data: 09/04/2026
Autore: AG-BACKEND
Modulo: Quote e Promo / Accounting
Protocollo: F1-PROTOCOLLO-011
Descrizione:
- Aggiunta colonna \`season_id\` alla tabella \`accounting_periods\`.
- Collegati i 10 periodi di validità alla stagione 25-26 (ID=1).
- Generati in anticipo i 10 periodi per le stagioni 24-25 e 26-27.
- Implementati filtri server-side per stagione (seasonId) negli endpoint \`/api/price-matrix\`, \`/api/promo-rules\`, \`/api/instructor-agreements\`, \`/api/accounting-periods\`, e \`/api/carnet-wallets\`.
- Introdotta la risoluzione dinamica \`seasonId=active\` direttamente da Express.
`;

gae = gae.replace('## ROADMAP PROSSIMI GIORNI', updateLog + '\n## ROADMAP PROSSIMI GIORNI');
fs.writeFileSync(gaePath, gae);

const masterPath = './MASTER_STATUS.md';
if (fs.existsSync(masterPath)) {
  let master = fs.readFileSync(masterPath, 'utf8');
  master = master.replace('✅ F1-PROTOCOLLO-010', '✅ F1-PROTOCOLLO-010\n✅ F1-PROTOCOLLO-011');
  fs.writeFileSync(masterPath, master);
}
console.log("Docs updated.");
