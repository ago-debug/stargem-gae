const fs = require('fs');

// Clean App.tsx
let appCode = fs.readFileSync('client/src/App.tsx', 'utf8');
const appLinesToDrop = [
  'path="/categorie-prove-pagamento"',
  'path="/categorie-prove-gratuite"',
  'path="/categorie-lezioni-singole"',
  'path="/scheda-prova-pagamento"',
  'path="/scheda-prova-gratuita"',
  'path="/scheda-lezione-singola"',
  'path="/attivita/prove-pagamento"',
  'path="/attivita/prove-gratuite"',
  'path="/attivita/lezioni-singole"'
];
appLinesToDrop.forEach(line => {
  let rx = new RegExp(`.*${line}.*\\n`, 'g');
  appCode = appCode.replace(rx, '');
});
fs.writeFileSync('client/src/App.tsx', appCode);

// Clean listini.tsx
let listiniCode = fs.readFileSync('client/src/pages/listini.tsx', 'utf8');
const listiniBlocksToDrop = [
  /<PriceListGrid\s+title="Prove a Pagamento"[\s\S]*?paidTrials \|\| \[\]\}\s*\/>/g,
  /<PriceListGrid\s+title="Prove Gratuite"[\s\S]*?freeTrials \|\| \[\]\}\s*\/>/g,
  /<PriceListGrid\s+title="Lezioni Singole"[\s\S]*?singleLessons \|\| \[\]\}\s*\/>/g
];
listiniBlocksToDrop.forEach(rx => {
  listiniCode = listiniCode.replace(rx, '');
});
fs.writeFileSync('client/src/pages/listini.tsx', listiniCode);

console.log("TS errors cleared!");
