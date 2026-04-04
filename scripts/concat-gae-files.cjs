const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../_GAE_SVILUPPO');
const dirs = [dir, path.join(dir, 'attuale'), path.join(dir, 'futuro')];

let content = '';

for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d);
    for (const file of files) {
        if (file.endsWith('.md')) {
            const p = path.join(d, file);
            content += '---\nFILE: ' + file + '\n---\n';
            content += fs.readFileSync(p, 'utf8') + '\n\n';
        }
    }
}

fs.writeFileSync('/tmp/all_gae_files.md', content);
