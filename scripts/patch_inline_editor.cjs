const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add comment at the top
content = "// PENNINO A: showColors=false (default) - lista semplice\n// PENNINO B: showColors=true - lista colorata multi\n" + content;

// Add prop
content = content.replace(
  'listName: string;\n}',
  'listName: string;\n  showColors?: boolean;\n}'
);

content = content.replace(
  'export function InlineListEditor({ listCode, listName }: InlineListEditorProps) {',
  'export function InlineListEditor({ listCode, listName, showColors = false }: InlineListEditorProps) {'
);

// Add color input for creation
content = content.replace(
  'const [newValue, setNewValue] = useState("");',
  'const [newValue, setNewValue] = useState("");\n  const [newColor, setNewColor] = useState("#4f46e5");'
);

content = content.replace(
  'await apiRequest("POST", `/api/custom-lists/${listData.id}/items`, { value: val, sortOrder: maxOrder + 1, active: true });',
  'await apiRequest("POST", `/api/custom-lists/${listData.id}/items`, { value: val, sortOrder: maxOrder + 1, active: true, color: showColors ? newColor : null });'
);

// Update creation UI
const creationUI = `<Input 
          size={1}
          placeholder="Nuova voce..." 
          value={newValue} 
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newValue.trim()) createMutation.mutate(newValue.trim());
          }}
          className="h-8 text-sm"
        />`;

const newCreationUI = `{showColors && (
          <Input 
            type="color" 
            value={newColor} 
            onChange={(e) => setNewColor(e.target.value)}
            className="w-8 h-8 p-0 border-0 cursor-pointer shrink-0"
            title="Colore"
          />
        )}
        <Input 
          size={1}
          placeholder="Nuova voce..." 
          value={newValue} 
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newValue.trim()) createMutation.mutate(newValue.trim());
          }}
          className="h-8 text-sm"
        />`;

content = content.replace(creationUI, newCreationUI);

// Update item rendering to show color
const itemUI = `<span className="text-sm truncate">{item.value}</span>`;
const newItemUI = `{showColors && item.color ? (
              <div 
                className="w-3 h-3 rounded-full shrink-0 mr-2" 
                style={{ backgroundColor: item.color }} 
              />
            ) : null}
            <span className="text-sm truncate">{item.value}</span>`;

content = content.replace(itemUI, newItemUI);

// Re-replace because the span is inside a div flex justify-between
content = content.replace(
  '<span className="text-sm truncate">{item.value}</span>',
  `<div className="flex items-center truncate">
              {showColors && item.color ? (
                <div className="w-3 h-3 rounded-full shrink-0 mr-2" style={{ backgroundColor: item.color }} />
              ) : null}
              <span className="text-sm truncate">{item.value}</span>
            </div>`
);

fs.writeFileSync(file, content);
console.log("InlineListEditor patched");
