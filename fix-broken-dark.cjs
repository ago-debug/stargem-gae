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

  // Fix broken dark variants like dark:bg-amber-950/20/30 -> dark:bg-amber-950/20
  content = content.replace(/dark:bg-([a-z]+)-950\/20\/[0-9]+/g, 'dark:bg-$1-950/20');
  content = content.replace(/dark:bg-([a-z]+)-900\/30\/[0-9]+/g, 'dark:bg-$1-900/30');
  content = content.replace(/bg-([a-z]+)-50\/[0-9]+ dark:bg-([a-z]+)-950\/20/g, 'bg-$1-50 dark:bg-$2-950/20'); // wait, the original was bg-amber-50 dark:bg-amber-950/20/30

  // The actual broken string is `bg-amber-50 dark:bg-amber-950/20/30`
  // We want `bg-amber-50/30 dark:bg-amber-950/20`
  // Wait, let's just do:
  content = content.replace(/bg-([a-z]+)-50 dark:bg-([a-z]+)-950\/20\/([0-9]+)/g, 'bg-$1-50/$3 dark:bg-$2-950/20');
  content = content.replace(/bg-([a-z]+)-100 dark:bg-([a-z]+)-900\/30\/([0-9]+)/g, 'bg-$1-100/$3 dark:bg-$2-900/30');

  // Also replace #f8f9fa in calendar
  content = content.replace(/bg-\[\#f8f9fa\]/g, 'bg-[#f8f9fa] dark:bg-slate-900');
  content = content.replace(/text-\[\#444\]/g, 'text-[#444] dark:text-slate-300');
  content = content.replace(/border-\[\#eee\]/g, 'border-[#eee] dark:border-slate-800');
  content = content.replace(/text-\[\#666\]/g, 'text-[#666] dark:text-slate-400');
  
  // Knowledge base active tab: bg-amber-400
  // Gestione note url badge: bg-amber-100
  // GemTeam non pervenuti: bg-yellow-50

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
});

console.log(`Changed ${changed} files.`);
