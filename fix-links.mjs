import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

const filesToUpdate = [
    'scheda-corso.tsx',
    'scheda-workshop.tsx',
    'scheda-prova-pagamento.tsx',
    'scheda-prova-gratuita.tsx',
    'scheda-lezione-singola.tsx',
    'scheda-domenica.tsx',
    'scheda-allenamento.tsx',
    'scheda-lezione-individuale.tsx',
    'scheda-campus.tsx',
    'scheda-saggio.tsx',
    'scheda-vacanza-studio.tsx'
];

for (const file of filesToUpdate) {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File non trovato: ${file}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Sostituisci il nome e cognome non cliccabili con i Link a /?memberId=X
    const nomeOldRegex = /<TableCell className="font-medium text-slate-900">\{member\.firstName\}<\/TableCell>/g;
    const nomeNewReplace = `<TableCell className="font-medium text-slate-900">\n                                                <Link href={\`/?memberId=\${member.id}\`} className="hover:underline cursor-pointer">\n                                                    {member.firstName}\n                                                </Link>\n                                            </TableCell>`;

    // Some files might have slightly different indentation, so let's do a more robust string replace if exact doesn't match
    content = content.replace(nomeOldRegex, nomeNewReplace);

    const cognomeOldRegex = /<TableCell className="font-medium text-slate-900">\{member\.lastName\}<\/TableCell>/g;
    const cognomeNewReplace = `<TableCell className="font-medium text-slate-900">\n                                                <Link href={\`/?memberId=\${member.id}\`} className="hover:underline cursor-pointer">\n                                                    {member.lastName}\n                                                </Link>\n                                            </TableCell>`;

    content = content.replace(cognomeOldRegex, cognomeNewReplace);

    // Sostituisci il link "Profilo Completo"
    const profileLinkRegex = /<Link href=\{`\/anagrafica_a_lista\?search=\$\{encodeURIComponent\(`\$\{member\.firstName\} \$\{member\.lastName\}`\)\}`\}>/g;
    const profileLinkNew = `<Link href={\`/?memberId=\${member.id}\`}>`;

    content = content.replace(profileLinkRegex, profileLinkNew);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Aggiornati i link in ${file}`);
}

console.log('Script aggiornamento link completato.');
