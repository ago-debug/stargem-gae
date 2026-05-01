const fs = require('fs');
const path = require('path');

const srcDir = './client/src';
const serverDir = './server';
const sharedDir = './shared';

console.log("Analyzing project structure...");

// Find main pages
const pages = fs.readdirSync(path.join(srcDir, 'pages')).filter(f => f.endsWith('.tsx'));
console.log(`\nFound ${pages.length} Pages:`);
console.log(pages.slice(0, 10).join(', ') + (pages.length > 10 ? '...' : ''));

// Find schema exports
const schemaContent = fs.readFileSync(path.join(sharedDir, 'schema.ts'), 'utf8');
const tables = [...schemaContent.matchAll(/export const (\w+) = mysqlTable/g)].map(m => m[1]);
console.log(`\nFound ${tables.length} Database Tables:`);
console.log(tables.slice(0, 10).join(', ') + (tables.length > 10 ? '...' : ''));

// Find API routes
const routesContent = fs.readFileSync(path.join(serverDir, 'routes.ts'), 'utf8');
const apiRoutes = [...routesContent.matchAll(/app\.(get|post|put|patch|delete)\(['"`](.+?)['"`]/g)].map(m => `${m[1].toUpperCase()} ${m[2]}`);
console.log(`\nFound ${apiRoutes.length} API Routes:`);
console.log(apiRoutes.slice(0, 10).join(', ') + (apiRoutes.length > 10 ? '...' : ''));

