const fs = require('fs');
const file = 'client/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import Elenchi from "@\/pages\/elenchi";\n/g, '');
content = content.replace(/<ProtectedRoute path="\/elenchi" component=\{Elenchi\} \/>\n/g, '');

fs.writeFileSync(file, content);
console.log("App patched again");
