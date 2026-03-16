const fs = require('fs');
const glob = require('glob');

const files = glob.sync('client/src/pages/scheda-*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const hookRegex = /^[ \t]*const[ \t]*{[ \t]*sortConfig,[ \t]*handleSort,[ \t]*sortItems,[ \t]*isSortedColumn[ \t]*}[ \t]*=[ \t]*useSortableTable[^;]+;/m;
  
  const match = content.match(hookRegex);
  if (match) {
    const hookString = match[0];
    content = content.replace(hookRegex, '');
    
    // Find the place right after the useLocation/useQuery hooks and before any if statement
    // Specifically before `if (coursesLoading || itemsLoading ...`
    const insertPointRegex = /^[ \t]*if[ \t]*\([a-zA-Z]+Loading[ \t]*\|\|/m;
    const insertMatch = content.match(insertPointRegex);
    
    if (insertMatch) {
      const idx = insertMatch.index;
      content = content.slice(0, idx) + hookString + '\n' + content.slice(idx);
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    } else {
      console.log('Could not find insert point for', file);
    }
  } else {
    console.log('Could not find hook for', file);
  }
});
