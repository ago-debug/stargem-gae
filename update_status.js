const fs = require('fs');
const files = [
  'client/src/pages/calendar.tsx',
  'client/src/pages/courses.tsx',
  'client/src/lib/enrollments.ts',
  'client/src/pages/workshops.tsx'
];

files.forEach(file => {
  const path = `/Users/gaetano1/SVILUPPO/CourseManager_Source_Export/${file}`;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/e\.status === 'active'/g, "(e.status === 'active' || !e.status)");
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
