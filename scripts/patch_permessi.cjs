const fs = require('fs');
const file = 'client/src/pages/utenti-permessi.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\s*\{\s*path:\s*"\/elenchi",\s*title:\s*"26\. Elenchi Custom"\s*\},\n/g, '\n');

fs.writeFileSync(file, content);
console.log("Permessi patched");
