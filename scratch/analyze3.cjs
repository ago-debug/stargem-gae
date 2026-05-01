const fs = require('fs');
const path = require('path');

const srcDir = './client/src';

const uiComponents = fs.readdirSync(path.join(srcDir, 'components')).filter(f => f.endsWith('.tsx'));
console.log(`Found ${uiComponents.length} Shared Components`);
console.log(uiComponents.slice(0, 10).join(', ') + (uiComponents.length > 10 ? '...' : ''));

const hooks = fs.readdirSync(path.join(srcDir, 'hooks')).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
console.log(`\nFound ${hooks.length} Custom Hooks`);
console.log(hooks.slice(0, 10).join(', ') + (hooks.length > 10 ? '...' : ''));

