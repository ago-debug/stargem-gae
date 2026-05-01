const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all API endpoints defined in backend
const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
const definedApis = [...routesContent.matchAll(/app\.(get|post|put|patch|delete)\(['"`](\/api\/[^'"`?]+)/g)].map(m => m[2]);
const uniqueDefinedApis = [...new Set(definedApis)];

// Search for API calls in frontend
const grepResult = execSync('grep -r "/api/" ./client/src || true', { encoding: 'utf8' });
const usedApis = new Set();
grepResult.split('\n').forEach(line => {
    const match = line.match(/\/api\/[a-zA-Z0-9_/-]+/);
    if (match) {
        usedApis.add(match[0]);
    }
});

const usedApisArray = Array.from(usedApis);

// Find APIs defined but potentially not used (exact string match is tricky because of dynamic params like /api/users/${id}, but we can check base routes)
const unusedBaseRoutes = [];
const baseDefined = new Set(uniqueDefinedApis.map(a => a.split('/').slice(0, 3).join('/')));
const baseUsed = new Set(usedApisArray.map(a => a.split('/').slice(0, 3).join('/')));

for (const base of baseDefined) {
    if (!baseUsed.has(base)) {
        unusedBaseRoutes.push(base);
    }
}

console.log("Base API routes defined in backend but NOT found in frontend source (Potential dead code):");
console.log(unusedBaseRoutes);

