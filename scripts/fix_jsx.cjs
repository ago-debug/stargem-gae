const fs = require('fs');
const file = 'client/src/pages/elenchi.tsx';
let content = fs.readFileSync(file, 'utf8');

// I'll revert my regexes by restoring the file and doing it right. Wait, the file is already overwritten.
// Let's just fix the JSX manually.

content = content.replace(
  '{showColors !== false && <input\n                    type="color"\n                    value={editingColor || "#9ca3af"}\n                    onChange={(e) => setEditingColor(e.target.value)}\n                    className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0"\n                    title="Colore"\n                    data-testid={`input-elenchi-edit-color-${testIdPrefix}-${item.id}`}\n                  />',
  '{showColors !== false && <input type="color" value={editingColor || "#9ca3af"} onChange={(e) => setEditingColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-input flex-shrink-0" title="Colore" /> }'
);

// Ah wait, looking at the previous regex, it matched something different. I'll just write a script to fix the JSX.
