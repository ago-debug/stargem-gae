const fs = require('fs');
const path = require('path');

const srcDir = './client/src';
const pagesDir = path.join(srcDir, 'pages');

// Find all files in root with old/bak/temp
const rootFiles = fs.readdirSync('.').filter(f => fs.statSync(f).isFile());
const suspiciousRootFiles = rootFiles.filter(f => 
    f.includes('bak') || f.includes('old') || f.includes('temp') || 
    f.includes('scratch') || f.includes('test') || f.includes('audit') || 
    f.includes('check') || f.includes('fix') || f.includes('dump') || 
    f.endsWith('.sql') || f.endsWith('.sh') || f.endsWith('.cjs') || f.endsWith('.mjs')
);

console.log("Suspicious root files (candidates for cleanup):", suspiciousRootFiles.length);

// Read App.tsx to find stubs and commented out routes
const appTsx = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
const stubs = [...appTsx.matchAll(/const (Stub\w+) = \(\) =>/g)].map(m => m[1]);
console.log("\nStubs in App.tsx (Unimplemented/Mocked features):", stubs);

const commentedRoutes = [...appTsx.matchAll(/\{\/\*.*?<ProtectedRoute path="([^"]+)".*?\*\/\}/gs)].map(m => m[1]);
console.log("\nCommented routes in App.tsx (Legacy/Disabled):", commentedRoutes);

// Find pages that are not imported in App.tsx
const allPages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
const importedPages = [...appTsx.matchAll(/import \w+ from "@\/pages\/([^"]+)"/g)].map(m => m[1] + '.tsx');

const unusedPages = allPages.filter(p => !importedPages.includes(p));
console.log("\nPages not explicitly imported in App.tsx (Potential dead code):", unusedPages);

// Find unused tables in schema.ts
const schema = fs.readFileSync('./shared/schema.ts', 'utf8');
const tables = [...schema.matchAll(/export const (\w+) = mysqlTable/g)].map(m => m[1]);
// We can check if tables are used in server/routes.ts
const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
const unusedTables = tables.filter(t => !routesContent.includes(t));
console.log("\nTables defined in schema but potentially not directly referenced in routes.ts:", unusedTables);

