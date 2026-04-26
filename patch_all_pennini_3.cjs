const fs = require('fs');

const file1 = 'client/src/components/PaymentModuleConnector.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
if (!content1.includes('InlineListEditorDialog')) {
  content1 = content1.replace(/import \{ InlineListEditor \} from "[^"]+";/g, 'import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";');
  fs.writeFileSync(file1, content1);
}

const file2 = 'client/src/pages/maschera-input-generale.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
if (!content2.includes('InlineListEditorDialog')) {
  content2 = content2.replace(/import \{ InlineListEditor \} from "[^"]+";/g, 'import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";');
  fs.writeFileSync(file2, content2);
}
