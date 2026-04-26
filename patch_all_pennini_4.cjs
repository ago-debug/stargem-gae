const fs = require('fs');

const file1 = 'client/src/components/PaymentModuleConnector.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
  /<InlineListEditor listCode="metodi_pagamento"/g,
  '<InlineListEditorDialog listCode="metodi_pagamento"'
);
fs.writeFileSync(file1, content1);

const file2 = 'client/src/pages/maschera-input-generale.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  /<InlineListEditor listCode="canale_acquisizione"/g,
  '<InlineListEditorDialog listCode="canale_acquisizione"'
);
fs.writeFileSync(file2, content2);
