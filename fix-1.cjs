const fs = require('fs');
const content = fs.readFileSync('client/src/pages/calendar.tsx', 'utf8');

const regexR1 = /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto md:justify-end pb-1 md:pb-0">/g;
const regexR2 = /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap shrink-0">/g;
const regexR3 = /<div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto md:justify-end pb-1 md:pb-0">/g; // Wait, row 2 part 2 is this?

console.log("R1:", content.match(regexR1)?.length);
console.log("R2:", content.match(regexR2)?.length);
