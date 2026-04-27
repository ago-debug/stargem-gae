const fs = require('fs');

const files = [
  'client/src/components/multi-select-internal.tsx',
  'client/src/components/multi-select-status.tsx',
  'client/src/components/multi-select-enrollment-details.tsx',
  'client/src/components/multi-select-payment-notes.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // For internal and others
    content = content.replace(
      /\{\s*isSelected\s*&&\s*\(\s*<span className="text-xs text-muted-foreground">\s*#\{.*?\}\s*<\/span>\s*\)\s*\}/g,
      `{isSelected && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 rounded-sm">
                      ✓
                    </span>
                  )}`
    );
    
    fs.writeFileSync(file, content);
  }
}
