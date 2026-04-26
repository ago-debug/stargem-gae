const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Trova il div incriminato e sostituiscilo
content = content.replace(
  /<div className="flex flex-col gap-1 mt-2 pr-1" style=\{\{ maxHeight: "250px", overflowY: "auto", overscrollBehavior: "contain" \}\}>/g,
  '<div className="mt-2 pr-1" style={{ maxHeight: "250px", overflowY: "auto", overscrollBehavior: "contain", display: "block" }}>'
);

// Trova gli items e aggiungi mb-1 per ricreare il gap
content = content.replace(
  /<div key=\{item.id\} className="flex justify-between items-center group rounded-md hover:bg-slate-50 px-2 py-1">/g,
  '<div key={item.id} className="flex justify-between items-center group rounded-md hover:bg-slate-50 px-2 py-1 mb-1">'
);

fs.writeFileSync(file, content);
