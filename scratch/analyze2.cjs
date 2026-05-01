const fs = require('fs');

const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
const apiRoutes = [...routesContent.matchAll(/app\.(get|post|put|patch|delete)\(['"`](\/api\/[^'"`]+)/g)].map(m => m[2]);

// Extract unique root endpoints
const endpoints = apiRoutes.map(route => {
    const parts = route.split('/');
    if (parts.length > 2) {
        return parts[2];
    }
    return 'unknown';
});

const counts = {};
endpoints.forEach(ep => {
    counts[ep] = (counts[ep] || 0) + 1;
});

const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log("API Endpoints by Frequency:");
sortedCounts.forEach(([ep, count]) => {
    console.log(`- /api/${ep}: ${count} routes`);
});
