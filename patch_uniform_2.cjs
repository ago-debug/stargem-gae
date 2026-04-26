const fs = require('fs');

const file2 = 'client/src/components/multi-select-status.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

// Add ChevronDown import if missing
if (!content2.includes('ChevronDown')) {
  content2 = content2.replace(/import \{ X, Edit \} from "lucide-react";/, 'import { X, Edit, ChevronDown } from "lucide-react";');
}

// Replace the wrapper
content2 = content2.replace(
  /<div\s+className="min-h-9 w-full rounded-md border border-input bg-background px-3 py-1\.5 text-sm cursor-pointer flex items-center flex-wrap gap-1"\s+onClick=\{[^}]+\}\s+data-testid=\{`select-\$\{testIdPrefix\}-trigger`\}\s*>/,
  `<div
          className="flex min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-accent/50 cursor-pointer transition-colors focus-within:ring-1 focus-within:ring-ring"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          data-testid={\`select-\${testIdPrefix}-trigger\`}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 pr-2 overflow-hidden">`
);

// We need to close the added div and add the ChevronDown
// The end of the trigger div currently looks like this:
/*
          {selectedStatuses.length > 0 && (
            <div className="flex items-center ml-auto">
              ... X buttons (hidden)
            </div>
          )}
        </div>
*/
content2 = content2.replace(
  /\{\s*selectedStatuses\.length > 0 && \([\s\S]+?\}\s*\)\s*\}\s*<\/div>/,
  `{selectedStatuses.length > 0 && (
            <div className="flex items-center ml-auto">
              {selectedStatuses.map((statusName) => (
                <button
                  key={statusName}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStatus(statusName);
                  }}
                  className="ml-0.5 hover:text-destructive hidden"
                  data-testid={\`button-\${testIdPrefix}-remove-\${statusName}\`}
                >
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          </div>
          <ChevronDown className={cn("h-4 w-4 opacity-50 shrink-0 transition-transform", isDropdownOpen && "rotate-180")} />
        </div>`
);

fs.writeFileSync(file2, content2);
