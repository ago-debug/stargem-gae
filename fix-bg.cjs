const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./client/src');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Safely replace bg-white with bg-background
  // But wait, if it's "bg-white", replace with "bg-background". 
  // Exception: AvatarImage fallback or something that actually needs white.
  // We'll just replace \bbg-white\b with bg-background and \bbg-slate-50\b with bg-muted
  content = content.replace(/\bbg-white\b/g, 'bg-background');
  content = content.replace(/\bbg-slate-50\b/g, 'bg-muted');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
    console.log(`Fixed ${file}`);
  }
});

console.log(`Changed ${changed} files.`);
