const fs = require('fs');

const file1 = 'client/src/components/multi-select-internal.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

// Replace InternalBadge component definition
content1 = content1.replace(/export function InternalBadge[\s\S]+?\}\n/m, '');

// Import StatusBadge
content1 = content1.replace(/import \{ useQuery \} from "@tanstack\/react-query";/, 'import { useQuery } from "@tanstack/react-query";\nimport { StatusBadge } from "./multi-select-status";');

// Replace InternalBadge usage with StatusBadge
content1 = content1.replace(/<InternalBadge\s+key=\{tagName\}\s+name=\{tagName\}\s+color=\{tag\?\.color\}\s+\/>/g, 
  '<StatusBadge key={tagName} name={tagName} color={tag?.color} className="flex items-center gap-1" />');

// Update the wrapper to match the desired unified style (it mostly is, just change bg-transparent to bg-background)
content1 = content1.replace(/bg-transparent px-3 py-1.5 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground/g, 
  'bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-accent/50');

fs.writeFileSync(file1, content1);
