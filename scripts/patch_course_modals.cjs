const fs = require('fs');
const file = 'client/src/components/CourseUnifiedModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove useStates
const statesToRemove = [
  'const [isGenereModalOpen, setIsGenereModalOpen] = useState(false);',
  'const [isNumeroPersoneModalOpen, setIsNumeroPersoneModalOpen] = useState(false);',
  'const [isPostiModalOpen, setIsPostiModalOpen] = useState(false);',
  'const [isLivelloModalOpen, setIsLivelloModalOpen] = useState(false);',
  'const [isFasciaEtaModalOpen, setIsFasciaEtaModalOpen] = useState(false);',
  'const [isGruppiCampusModalOpen, setIsGruppiCampusModalOpen] = useState(false);',
  'const [isPacchettiModalOpen, setIsPacchettiModalOpen] = useState(false);',
];

statesToRemove.forEach(state => {
  content = content.replace(state + '\n', '');
  content = content.replace(state, '');
});

// 2. Remove the CustomListManagerDialog imports and tags
content = content.replace('import { CustomListManagerDialog } from "@/components/custom-list-manager-dialog";\n', '');
content = content.replace(/<CustomListManagerDialog[^>]+open=\{is[a-zA-Z]+ModalOpen\}[^>]*\/>/g, '');

// Also remove empty lines that might have been left
content = content.replace(/\n\s*\n\s*<\/DialogContent>/g, '\n      </DialogContent>');

// 3. Inject Pennini Inline
function replaceButton(content, searchString, listCode, listName, showColors = false, iconClass = "text-slate-500") {
  const replacement = `<Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <Edit className="w-3 h-3 ${iconClass}" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <InlineListEditor listCode="${listCode}" listName="${listName}" showColors={${showColors}} />
          </PopoverContent>
        </Popover>`;

  // Instead of simple string replace which might miss due to formatting, we use regex if possible
  // We'll replace the button directly
  // Genere Corso -> setIsGenereModalOpen
  // Livello -> setIsLivelloModalOpen
  // Fascia Età -> setIsFasciaEtaModalOpen
  // Posti -> setIsPostiModalOpen
  // Numero Persone -> setIsNumeroPersoneModalOpen
  // Campus -> setIsGruppiCampusModalOpen
  // Pacchetti -> setIsPacchettiModalOpen
  return content;
}

fs.writeFileSync(file, content);
console.log("Modals removed");
