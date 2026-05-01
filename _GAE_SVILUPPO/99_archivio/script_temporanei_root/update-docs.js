import fs from 'fs';
import path from 'path';

const devDir = '/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO';
const dirs = [devDir, path.join(devDir, 'attuale'), path.join(devDir, 'futuro')];

const oldDateStr = '2026_04_26_1800';
const newDateStr = '2026_04_27_1300';
const oldDateHeader = '2026-04-26 12:30'; // Or anything from yesterday
const newDateHeader = '2026-04-27 13:00';

for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const filePath = path.join(dir, file);
        
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Update header
        content = content.replace(/Aggiornato al: 2026-04-26 \d{2}:\d{2}/g, `Aggiornato al: ${newDateHeader}`);
        content = content.replace(/Aggiornamento 26\/04\/2026 18:00/g, `Aggiornamento 27/04/2026 13:00`);
        
        fs.writeFileSync(filePath, content, 'utf-8');
        
        if (file.includes(oldDateStr)) {
            const newFile = file.replace(oldDateStr, newDateStr);
            fs.renameSync(filePath, path.join(dir, newFile));
            console.log(`Renamed ${file} to ${newFile}`);
        }
    }
}
