const fs = require('fs');
console.log(fs.readFileSync('client/src/components/inline-list-editor.tsx', 'utf8').includes('maxHeight: "250px"'));
