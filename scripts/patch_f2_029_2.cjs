const fs = require('fs');

const importPopover = `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { InlineListEditor } from "@/components/inline-list-editor";\n`;

function patchFile(file, listCode, listName, buttonClass) {
  let content = fs.readFileSync(file, 'utf8');

  // Add imports
  content = content.replace('import { Checkbox } from "@/components/ui/checkbox";', 'import { Checkbox } from "@/components/ui/checkbox";\n' + importPopover);

  // Remove useLocation
  content = content.replace('import { useLocation } from "wouter";\n', '');
  content = content.replace('const [, setLocation] = useLocation();\n', '');

  // Add staleTime: 0
  content = content.replace('queryKey: [`/api/custom-lists/${systemCode}`],', 'queryKey: [`/api/custom-lists/${systemCode}`],\n    staleTime: 0,');
  content = content.replace('queryKey: ["/api/custom-lists/stato_corso"],', 'queryKey: ["/api/custom-lists/stato_corso"],\n    staleTime: 0,');

  // Replace Edit button
  const oldButtonRegex = /<Button\s+type="button"\s+size="icon"\s+variant="ghost"\s+className="[^"]+"\s+onClick=\{\(\) => setLocation\('\/elenchi\?area=corsi'\)\}\s*>\s*<Edit className="[^"]+" \/>\s*<\/Button>/;
  
  const newPopover = `<Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="${buttonClass}"
            >
              <Edit className="w-3 h-3 sidebar-icon-gold" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <InlineListEditor listCode="${listCode}" listName="${listName}" />
          </PopoverContent>
        </Popover>`;

  content = content.replace(oldButtonRegex, newPopover);
  
  fs.writeFileSync(file, content);
}

patchFile('client/src/components/multi-select-status.tsx', 'stato_corso', 'Stato Corso', 'h-5 w-5');
patchFile('client/src/components/multi-select-internal.tsx', 'tag_interni', 'Interno Corso', 'h-5 w-5');

console.log("FIX 2 and 3 applied");
