import fs from 'fs';
const routes = fs.readFileSync('server/routes.ts', 'utf8');
const lines = routes.split('\n');
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("app.get('/api/enrollments'")) {
    found = true;
    for (let j = i; j < i + 30; j++) {
      console.log(lines[j]);
    }
    break;
  }
}
