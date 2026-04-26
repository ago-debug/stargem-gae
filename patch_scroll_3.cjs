const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Trova il div incriminato e sostituiscilo
content = content.replace(
  /<div className="flex flex-col gap-1 mt-2 max-h-64 overflow-y-auto pr-1">/g,
  '<div className="flex flex-col gap-1 mt-2 pr-1" style={{ maxHeight: "250px", overflowY: "auto", overscrollBehavior: "contain" }}>'
);

fs.writeFileSync(file, content);
