const fs = require('fs');
const file = 'client/src/components/multi-select-internal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{selectedTags.length > 0 ? (
            <span className="text-slate-800 font-medium truncate">
              {selectedTags.length} tag selezionati
            </span>
            ) : (
              <span className="text-muted-foreground">Seleziona interno corso...</span>
            )}`;

const replacement = `{selectedTags.length > 0 ? (
  <div className="flex flex-wrap gap-1">
    {selectedTags.map(tag => {
      const tagData = internalOptions?.find(
        t => t.name === tag || t.value === tag
      );
      const color = tagData?.color;
      return (
        <div key={tag}
          className="text-[10px] font-bold uppercase px-1.5 py-[2px] rounded-[3px] border inline-flex items-center"
          style={color ? {
            backgroundColor: \`\${color}15\`,
            color,
            borderColor: \`\${color}40\`
          } : {
            backgroundColor: '#f3f4f6',
            color: '#4f46e5',
            borderColor: '#c7d2fe'
          }}>
          {tag}
        </div>
      );
    })}
  </div>
) : (
  <span className="text-muted-foreground">Seleziona interno corso...</span>
)}`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log("FIX 4 applied");
