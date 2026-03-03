import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

const replacements = [
    { file: 'scheda-corso.tsx', type: 'corsi' },
    { file: 'scheda-workshop.tsx', type: 'workshop' },
    { file: 'scheda-prova-pagamento.tsx', type: 'prova-pagamento' },
    { file: 'scheda-prova-gratuita.tsx', type: 'prova-gratuita' },
    { file: 'scheda-lezione-singola.tsx', type: 'lezione-singola' },
    { file: 'scheda-domenica.tsx', type: 'domenica' },
    { file: 'scheda-allenamento.tsx', type: 'allenamento' },
    { file: 'scheda-lezione-individuale.tsx', type: 'lezione-individuale' },
    { file: 'scheda-campus.tsx', type: 'campus' },
    { file: 'scheda-saggio.tsx', type: 'saggio' },
    { file: 'scheda-vacanza-studio.tsx', type: 'vacanza-studio' }
];

for (const rep of replacements) {
    const filePath = path.join(pagesDir, rep.file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File non trovato: ${rep.file}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the exact string `queryKey: ["/api/enrollments"]` with `queryKey: ["/api/enrollments?type=<TYPE>"]`
    const oldString = `queryKey: ["/api/enrollments"]`;
    const newString = `queryKey: ["/api/enrollments?type=${rep.type}"]`;

    if (content.includes(oldString)) {
        content = content.replace(oldString, newString);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Aggiornato con successo ${rep.file} con type=${rep.type}`);
    } else {
        console.log(`Stringa non trovata in ${rep.file}, forse già aggiornato?`);
    }
}

console.log('Script completato.');
