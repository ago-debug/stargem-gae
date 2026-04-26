const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../client/src/pages/planning.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'return isClosedType && (e.affectsCalendar || e.affectsCalendar === 1) && dateStr >= eStart && dateStr <= eEnd;',
    'return isClosedType && (e.affectsCalendar || e.affectsCalendar === 1 || e.affectsPlanning || e.affectsPlanning === 1) && dateStr >= eStart && dateStr <= eEnd;'
);

fs.writeFileSync(file, content);
