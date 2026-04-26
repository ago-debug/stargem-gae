const fs = require('fs');
const file = 'client/src/pages/maschera-input-generale.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure Edit and InlineListEditor are imported
if (!content.includes('InlineListEditor')) {
    content = content.replace('import { Popover', 'import { InlineListEditor } from "@/components/inline-list-editor";\nimport { Popover');
}
if (!content.includes('import { Popover')) {
    content = content.replace('import { Input }', 'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Input }');
}

const oldLabel = '<Label className="uppercase text-xs font-semibold text-muted-foreground">Canale di Acquisizione</Label>';
const newLabel = `<div className="flex items-center gap-2">
                  <Label className="uppercase text-xs font-semibold text-muted-foreground">Canale di Acquisizione</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" size="icon" variant="ghost" className="h-4 w-4">
                        <Edit className="w-3 h-3 text-slate-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.stopPropagation()}>
                      <InlineListEditor listCode="canale_acquisizione" listName="Canale Acquisizione" showColors={false} />
                    </PopoverContent>
                  </Popover>
                </div>`;

content = content.replace(oldLabel, newLabel);
fs.writeFileSync(file, content);
console.log("Maschera patched");
