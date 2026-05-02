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

  // Fix text colors in knowledge-base
  content = content.replace(/text-blue-900(?!\s+dark:)/g, 'text-blue-900 dark:text-blue-300');
  content = content.replace(/text-blue-800(?!\s+dark:)/g, 'text-blue-800 dark:text-blue-300');
  content = content.replace(/text-red-800(?!\s+dark:)/g, 'text-red-800 dark:text-red-400');
  content = content.replace(/text-green-800(?!\s+dark:)/g, 'text-green-800 dark:text-green-400');
  content = content.replace(/border-blue-100(?!\s+dark:)/g, 'border-blue-100 dark:border-blue-900/50');
  content = content.replace(/border-red-100(?!\s+dark:)/g, 'border-red-100 dark:border-red-900/50');
  content = content.replace(/border-green-100(?!\s+dark:)/g, 'border-green-100 dark:border-green-900/50');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
});

console.log(`Changed ${changed} files.`);
