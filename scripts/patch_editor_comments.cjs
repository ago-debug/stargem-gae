const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldComments = "// PENNINO A: showColors=false (default) - lista semplice\n// PENNINO B: showColors=true - lista colorata multi\n";
const newComments = "// PENNINO A: showColors=false (default) | NO multi-selezione | lista semplice\n// PENNINO B: showColors=true | SÌ multi-selezione | lista colorata\n// PENNINO C: showColors=true | NO multi-selezione | colore assegnato\n";

if (content.includes(oldComments)) {
  content = content.replace(oldComments, newComments);
} else {
  // If it's not exactly that string, just prepend the new ones and remove the old if possible
  content = content.replace(/\/\/ PENNINO.*\n/g, '');
  content = newComments + content;
}

fs.writeFileSync(file, content);
console.log("Comments updated");
