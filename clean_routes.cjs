const fs = require('fs');
let code = fs.readFileSync('server/routes.ts', 'utf8');

const endpoints = [
  'paid-trials', 'free-trials', 'single-lessons',
  'paid-trial-enrollments', 'free-trial-enrollments', 'single-lesson-enrollments'
];

endpoints.forEach(ep => {
  let rx = new RegExp(`[ \\t]*router\\.(get|post|put|delete|patch)\\([\\'\\"]/api/${ep}[\\s\\S]*?(?=[ \\t]*router\\.(get|post|put|delete|patch)|$)`, 'gi');
  code = code.replace(rx, '');
});

fs.writeFileSync('server/routes.ts', code);
console.log("Routes cleaned via regex!");
