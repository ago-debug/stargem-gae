const fs = require('fs');
const content = fs.readFileSync('client/src/pages/calendar.tsx', 'utf8');

const regexR1 = /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto md:justify-end pb-1 md:pb-0">/g;
const regexR2 = /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap shrink-0">/g;

console.log("RIGA 1:", content.match(regexR1)?.length);
console.log("RIGA 2:", content.match(regexR2)?.length);
