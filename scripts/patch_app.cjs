const fs = require('fs');
const file = 'client/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Route path="\/elenchi" component=\{Elenchi\} \/>\s*/g;
content = content.replace(regex, '');

const importRegex = /import Elenchi from "\.\/pages\/elenchi";\s*/g;
content = content.replace(importRegex, '');

fs.writeFileSync(file, content);
console.log("App patched");
