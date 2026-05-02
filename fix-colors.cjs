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

const replacements = [
  { regex: /\bbg-amber-50(?! dark:bg-amber-950\/20)\b/g, replacement: 'bg-amber-50 dark:bg-amber-950/20' },
  { regex: /\bbg-amber-100(?! dark:bg-amber-900\/30)\b/g, replacement: 'bg-amber-100 dark:bg-amber-900/30' },
  { regex: /\bborder-amber-100(?! dark:border-amber-900\/50)\b/g, replacement: 'border-amber-100 dark:border-amber-900/50' },
  { regex: /\bborder-amber-200(?! dark:border-amber-900\/50)\b/g, replacement: 'border-amber-200 dark:border-amber-900/50' },
  { regex: /\bborder-amber-300(?! dark:border-amber-800\/50)\b/g, replacement: 'border-amber-300 dark:border-amber-800/50' },
  { regex: /\btext-amber-800(?! dark:text-amber-400)\b/g, replacement: 'text-amber-800 dark:text-amber-400' },
  { regex: /\btext-amber-900(?! dark:text-amber-300)\b/g, replacement: 'text-amber-900 dark:text-amber-300' },

  { regex: /\bbg-emerald-50(?! dark:bg-emerald-950\/20)\b/g, replacement: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { regex: /\bbg-emerald-100(?! dark:bg-emerald-900\/30)\b/g, replacement: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { regex: /\bborder-emerald-100(?! dark:border-emerald-900\/50)\b/g, replacement: 'border-emerald-100 dark:border-emerald-900/50' },
  { regex: /\bborder-emerald-200(?! dark:border-emerald-900\/50)\b/g, replacement: 'border-emerald-200 dark:border-emerald-900/50' },
  { regex: /\btext-emerald-800(?! dark:text-emerald-400)\b/g, replacement: 'text-emerald-800 dark:text-emerald-400' },
  { regex: /\btext-emerald-900(?! dark:text-emerald-300)\b/g, replacement: 'text-emerald-900 dark:text-emerald-300' },

  { regex: /\bbg-red-50(?! dark:bg-red-950\/20)\b/g, replacement: 'bg-red-50 dark:bg-red-950/20' },
  { regex: /\bbg-red-100(?! dark:bg-red-900\/30)\b/g, replacement: 'bg-red-100 dark:bg-red-900/30' },
  { regex: /\bborder-red-200(?! dark:border-red-900\/50)\b/g, replacement: 'border-red-200 dark:border-red-900/50' },

  { regex: /\bbg-blue-50(?! dark:bg-blue-950\/20)\b/g, replacement: 'bg-blue-50 dark:bg-blue-950/20' },
  { regex: /\bbg-blue-100(?! dark:bg-blue-900\/30)\b/g, replacement: 'bg-blue-100 dark:bg-blue-900/30' },

  { regex: /\bfrom-slate-50(?! dark:from-background)\b/g, replacement: 'from-slate-50 dark:from-background' },
  { regex: /\bto-white(?! dark:to-background)\b/g, replacement: 'to-white dark:to-background' },
  { regex: /\bto-slate-50(?! dark:to-background)\b/g, replacement: 'to-slate-50 dark:to-background' },
  { regex: /\bbg-slate-100(?! dark:bg-slate-800)\b/g, replacement: 'bg-slate-100 dark:bg-slate-800' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  replacements.forEach(rep => {
    content = content.replace(rep.regex, rep.replacement);
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
});

console.log(`Changed ${changed} files.`);
