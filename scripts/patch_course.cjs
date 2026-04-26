const fs = require('fs');
const file = 'client/src/components/CourseUnifiedModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add imports
content = content.replace('import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";', 'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { InlineListEditor } from "@/components/inline-list-editor";');

// If the import doesn't exist, we just put it near the top
if (!content.includes('InlineListEditor')) {
    content = content.replace('import { Popover', 'import { InlineListEditor } from "@/components/inline-list-editor";\nimport { Popover');
}

// Ensure Popover is imported
if (!content.includes('import { Popover')) {
    content = content.replace('import { Input }', 'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Input }');
}

// Replace the category button
const oldBtn = `<Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsCategoriaModalOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3 sidebar-icon-gold" />
                    </Button>`;

const newBtn = `<Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <Edit className="w-3 h-3 sidebar-icon-gold" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <InlineListEditor listCode="categorie" listName="Categorie Corsi" showColors={true} />
                      </PopoverContent>
                    </Popover>`;

content = content.replace(oldBtn, newBtn);

fs.writeFileSync(file, content);
console.log("CourseUnifiedModal patched");
