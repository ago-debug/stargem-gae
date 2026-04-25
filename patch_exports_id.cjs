const fs = require('fs');
const path = require('path');

const files = [
  'client/src/pages/members.tsx',
  'client/src/pages/payments.tsx',
  'client/src/pages/accounting-sheet.tsx',
  'client/src/pages/courses.tsx',
  'client/src/pages/workshops.tsx',
  'client/src/pages/studio-bookings.tsx',
  'client/src/pages/reports.tsx',
  'client/src/pages/gemteam.tsx',
  'client/src/pages/maschera-input-generale.tsx',
  'client/src/pages/anagrafica-home.tsx'
];

let updatedCount = 0;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We want to insert { key: 'id', label: 'ID Database', default: true }, 
    // right after columns={[
    // Make sure we only do it if it's not already there
    
    // Pattern to find columns={[ and replace with columns={[\n { key: 'id', label: 'ID Database', default: true },
    
    if (content.includes("columns={[")) {
      if (!content.includes("{ key: 'id', label: 'ID Database'")) {
        content = content.replace(
          /columns=\{\s*\[/g, 
          "columns={[\n              { key: 'id', label: 'ID Database', default: true },"
        );
        fs.writeFileSync(file, content);
        updatedCount++;
      } else {
        console.log(`${file} already has ID Database`);
      }
    } else {
      console.log(`Could not find columns={[ in ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
}

console.log(`Updated files: ${updatedCount}`);
