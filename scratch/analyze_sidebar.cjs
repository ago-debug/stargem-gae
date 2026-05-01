const fs = require('fs');

const sidebarContent = fs.readFileSync('./client/src/components/app-sidebar.tsx', 'utf8');

// Extract all URLs from the sidebar
const links = [...sidebarContent.matchAll(/url:\s*['"`](.+?)['"`]/g)].map(m => m[1]);

console.log("Links in Sidebar (Visible to user):");
console.log(links);

const appTsxContent = fs.readFileSync('./client/src/App.tsx', 'utf8');
const stubs = [...appTsxContent.matchAll(/const (Stub\w+) = \(\) => <GestioneAttivitaStub title="([^"]+)" description="([^"]+)"/g)].map(m => ({ component: m[1], title: m[2], description: m[3] }));

console.log("\nStubs defined in App.tsx:");
stubs.forEach(s => console.log(`- ${s.component} (${s.title}): ${s.description}`));

