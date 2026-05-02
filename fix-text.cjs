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
  
  // Replace text-slate-800, text-slate-900, text-gray-800, text-gray-900 with text-foreground
  content = content.replace(/\btext-(slate|gray)-(800|900)\b/g, 'text-foreground');
  
  // Replace text-slate-700 with text-foreground or text-muted-foreground depending on context, we'll just use text-foreground/90 to be safe, or just text-foreground
  content = content.replace(/\btext-(slate|gray)-700\b/g, 'text-foreground/80');
  
  // Replace text-slate-600, text-slate-500 with text-muted-foreground
  content = content.replace(/\btext-(slate|gray)-(500|600)\b/g, 'text-muted-foreground');

  // Also replace some hardcoded border-slate-200 with border-border
  content = content.replace(/\bborder-(slate|gray)-(200|300)\b/g, 'border-border');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
});

console.log(`Changed ${changed} files.`);
