const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/max-h-\[250px\]/g, 'max-h-64');

fs.writeFileSync(file, content);
