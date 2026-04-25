const fs = require('fs');

function addImport(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { ExportWizard }')) {
    content = `import { ExportWizard } from "@/components/ExportWizard";\n` + content;
    fs.writeFileSync(file, content);
  }
}

addImport('client/src/pages/anagrafica-home.tsx');
addImport('client/src/pages/members.tsx');
addImport('client/src/pages/studio-bookings.tsx');
addImport('client/src/pages/maschera-input-generale.tsx');
addImport('client/src/pages/gemteam.tsx');
addImport('client/src/pages/reports.tsx');
addImport('client/src/pages/workshops.tsx');
addImport('client/src/pages/courses.tsx');
addImport('client/src/pages/accounting-sheet.tsx');
addImport('client/src/pages/payments.tsx');

