const fs = require('fs');
const path = require('path');

const dir = './_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

const dateString = "01_05_26_1520";

files.forEach(file => {
    // Check if the file matches the pattern A_Nome.md
    const match = file.match(/^([A-Z])_(.+)$/);
    if (match) {
        const letter = match[1];
        const rest = match[2];
        
        // Ensure we don't duplicate the date string if we run it twice
        if (!rest.startsWith(dateString)) {
            const newFileName = `${letter}_${dateString}_${rest}`;
            const oldPath = path.join(dir, file);
            const newPath = path.join(dir, newFileName);
            
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newFileName}`);
        }
    }
});

