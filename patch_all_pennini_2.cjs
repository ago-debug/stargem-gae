const fs = require('fs');

const file1 = 'client/src/components/PaymentModuleConnector.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
  /<Popover(?:[^>]*)>\s*<PopoverTrigger asChild>\s*<Button([^>]*)>\s*<Edit className="[^"]*" \/>\s*<\/Button>\s*<\/PopoverTrigger>\s*<PopoverContent[^>]*>\s*<InlineListEditor listCode="metodi_pagamento" listName="Metodi Pagamento" showColors=\{false\} \/>\s*<\/PopoverContent>\s*<\/Popover>/g,
  '<InlineListEditorDialog listCode="metodi_pagamento" listName="Metodi Pagamento" showColors={false} />'
);
fs.writeFileSync(file1, content1);

const file2 = 'client/src/pages/maschera-input-generale.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  /<Popover(?:[^>]*)>\s*<PopoverTrigger asChild>\s*<Button([^>]*)>\s*<Edit className="[^"]*" \/>\s*<\/Button>\s*<\/PopoverTrigger>\s*<PopoverContent[^>]*>\s*<InlineListEditor listCode="canale_acquisizione" listName="Canale Acquisizione" showColors=\{false\} \/>\s*<\/PopoverContent>\s*<\/Popover>/g,
  '<InlineListEditorDialog listCode="canale_acquisizione" listName="Canale Acquisizione" showColors={false} />'
);
fs.writeFileSync(file2, content2);
