const fs = require('fs');
const file = 'server/services/unifiedBridge.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `  if (!course.dayOfWeek || !course.startTime) {
    const fallbackStart = course.startDate ? new Date(course.startDate) : new Date();
    const fallbackEnd = course.endDate ? new Date(course.endDate) : new Date(fallbackStart.getTime() + 3600000);
    return [buildBaseDTO(fallbackStart, fallbackEnd, \`course_\${course.id}\`)];
  }`;

const target2 = `  if (targetDay === undefined) {
    const fallbackStart = course.startDate ? new Date(course.startDate) : new Date();
    const fallbackEnd = course.endDate ? new Date(course.endDate) : new Date(fallbackStart.getTime() + 3600000);
    return [buildBaseDTO(fallbackStart, fallbackEnd, \`course_\${course.id}\`)];
  }`;

const replacement1 = `  if (!course.dayOfWeek || !course.startTime) {
    return []; // corso non schedulato - non renderizzare
  }`;

const replacement2 = `  if (targetDay === undefined) {
    return []; // giorno della settimana non riconosciuto - non renderizzare
  }`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync(file, content);
console.log("FIX 1 applied");
