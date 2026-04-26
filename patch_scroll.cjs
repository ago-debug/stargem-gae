const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div className="flex flex-col gap-3 p-2 w-72.*">/, '<div className="flex flex-col gap-3 p-2 w-72">');
content = content.replace(/<div className="flex flex-col gap-1 mt-2 overflow-y-auto pr-1 flex-1 min-h-0">/, '<div className="flex flex-col gap-1 mt-2 max-h-[250px] overflow-y-auto pr-1">');

fs.writeFileSync(file, content);
