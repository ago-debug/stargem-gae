const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../client/src/components/CourseDuplicationWizard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('  return (\n    <Dialog open={isOpen}', '  return (\n    <>\n    <Dialog open={isOpen}');
content = content.replace('      </Dialog>\n  );\n}', '      </Dialog>\n    </>\n  );\n}');

fs.writeFileSync(file, content);
