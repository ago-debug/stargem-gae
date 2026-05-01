const fs = require('fs');
const file = 'client/src/pages/calendar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /hover:z-50 overflow-hidden \$\{conflictEventId === evt\.id/g,
  'hover:z-50 ${conflictEventId === evt.id'
);

content = content.replace(
  /<div className="w-full h-full relative rounded-md border p-1 shadow-sm flex flex-col items-start bg-white overflow-hidden transition-colors border-blue-200">/g,
  '<div className="w-full min-h-full h-fit relative rounded-md border p-1 shadow-sm flex flex-col items-start bg-white overflow-hidden transition-colors border-blue-200">'
);

fs.writeFileSync(file, content);
