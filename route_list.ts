import fs from 'fs';
import path from 'path';

function main() {
  const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
  const content = fs.readFileSync(routesPath, 'utf8');
  
  const lines = content.split('\n');
  const routePatterns = lines.filter(line => line.match(/app\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/));
  
  const routePrefixes = new Set<string>();
  routePatterns.forEach(line => {
    const match = line.match(/app\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/);
    if (match) {
      const pathStr = match[2];
      const segments = pathStr.split('/');
      if (segments.length > 2) {
         routePrefixes.add(segments[2]);
      }
    }
  });
  
  console.log(Array.from(routePrefixes));
}
main();
