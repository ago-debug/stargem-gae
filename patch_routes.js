import fs from 'fs';

const filePath = '/Users/gaetano1/SVILUPPO/CourseManager_Source_Export/server/routes.ts';
let content = fs.readFileSync(filePath, 'utf8');

// We want to find catch blocks that don't already have console.error
// and add console.error("[API Error]", error) generic logging.

// A regex that finds `} catch (error_var) {` and injects `console.error('[API Error]', error_var);`
// if not already there in the next 3 lines.

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/catch\s*\(\s*([a-zA-Z0-9_]+)(\s*:\s*any)?\s*\)\s*\{/);
  if (match) {
    const errVar = match[1];
    // check next 1-3 lines for console.error
    let hasLog = false;
    for (let j = 1; j <= 3 && i + j < lines.length; j++) {
      if (lines[i+j].includes('console.error') || lines[i+j].includes('log(')) {
        hasLog = true;
        break;
      }
    }
    if (!hasLog) {
      // Find indentation
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] + '  ' : '  ';
      lines.splice(i + 1, 0, `${indent}console.error("[API Error] Caught explicitly:", ${errVar});`);
      i++; // skip the newly inserted line
    }
  }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Patched server/routes.ts successfully");
