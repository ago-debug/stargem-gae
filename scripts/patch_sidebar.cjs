const fs = require('fs');
const file = 'client/src/components/app-sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\s*title: "Elenchi Custom",\s*url: "\/elenchi",\s*icon: List,\s*\},\s*/g;
content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log("Sidebar patched");
