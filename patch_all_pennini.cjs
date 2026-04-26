const fs = require('fs');

const filesToPatch = [
  'client/src/components/CourseUnifiedModal.tsx',
  'client/src/components/multi-select-internal.tsx',
  'client/src/components/PaymentModuleConnector.tsx',
  'client/src/components/multi-select-status.tsx',
  'client/src/pages/maschera-input-generale.tsx'
];

for (const file of filesToPatch) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Aggiungi import se non c'è e rimuovi quello vecchio se c'è
  if (content.includes('InlineListEditorDialog')) continue; // già patchato
  
  content = content.replace(/import \{ InlineListEditor \} from "[^"]+";/g, 'import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";');
  
  // Trova tutti i blocchi <Popover> che contengono <InlineListEditor>
  const popoverRegex = /<Popover(?:[^>]*)>\s*<PopoverTrigger asChild>\s*<Button([^>]*)>\s*<Edit className="[^"]*" \/>\s*<\/Button>\s*<\/PopoverTrigger>\s*<PopoverContent[^>]*>\s*<InlineListEditor([^>]+)\/>\s*<\/PopoverContent>\s*<\/Popover>/g;
  
  content = content.replace(popoverRegex, (match, buttonAttrs, editorAttrs) => {
    return `<InlineListEditorDialog${editorAttrs}/>`;
  });

  fs.writeFileSync(file, content);
  console.log("Patched", file);
}
