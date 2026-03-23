const fs = require('fs');
let code = fs.readFileSync('client/src/pages/listini.tsx', 'utf8');

// The JSX elements look like:
// <PriceListGrid title="Prove a Pagamento" endpoint="/api/paid-trials" entities={paidTrials || []} />
// We just remove the lines containing paidTrials || []
code = code.split('\n').filter(line => 
  !line.includes('paidTrials || []') &&
  !line.includes('freeTrials || []') &&
  !line.includes('singleLessons || []') &&
  !line.includes('title="Prove a Pagamento"') &&
  !line.includes('title="Prove Gratuite"') &&
  !line.includes('title="Lezioni Singole"') &&
  !line.includes('endpoint="/api/paid-trials"') &&
  !line.includes('endpoint="/api/free-trials"') &&
  !line.includes('endpoint="/api/single-lessons"')
).join('\n');

fs.writeFileSync('client/src/pages/listini.tsx', code);
