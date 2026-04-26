const fs = require('fs');
const file = 'client/src/components/inline-list-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace everything with a rock-solid Tailwind utility approach
// h-64 = 256px, overflow-y-scroll always shows scrollbar
content = content.replace(
  /<div className="mt-2 pr-1" style=\{\{ maxHeight: "250px", overflowY: "auto", overscrollBehavior: "contain", display: "block" \}\}>/g,
  '<div className="h-48 overflow-y-scroll mt-2 pr-1" style={{ overscrollBehavior: "contain", borderBottom: "1px solid #eee", borderTop: "1px solid #eee" }}>'
);

content += '\nconsole.log("INLINE LIST EDITOR LOADED v5");\n';

fs.writeFileSync(file, content);
