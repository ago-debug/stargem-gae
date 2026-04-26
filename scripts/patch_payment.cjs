const fs = require('fs');
const file = 'client/src/components/PaymentModuleConnector.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure Edit and InlineListEditor are imported
if (!content.includes('InlineListEditor')) {
    content = content.replace('import { Popover', 'import { InlineListEditor } from "@/components/inline-list-editor";\nimport { Edit } from "lucide-react";\nimport { Popover');
}

const oldLabel = '<Label>Metodo Pagamento</Label>';
const newLabel = `<div className="flex items-center gap-2">
              <Label>Metodo Pagamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" className="h-5 w-5">
                    <Edit className="w-3 h-3 text-slate-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.stopPropagation()}>
                  <InlineListEditor listCode="metodi_pagamento" listName="Metodi Pagamento" showColors={false} />
                </PopoverContent>
              </Popover>
            </div>`;

content = content.replace(oldLabel, newLabel);
fs.writeFileSync(file, content);
console.log("PaymentModuleConnector patched");
