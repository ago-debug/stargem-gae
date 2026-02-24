
import fs from 'fs';
import path from 'path';

const COUNT = 1000;
const OUT_FILE = 'large_members.csv';

function randomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function randomDate(): string {
    const start = new Date(1950, 0, 1);
    const end = new Date(2010, 0, 1);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

function generate() {
    const headers = ['Nome', 'Cognome', 'Codice Fiscale', 'Email', 'Telefono', 'Data Nascita', 'Indirizzo'];
    const rows = [headers.join(',')];

    for (let i = 0; i < COUNT; i++) {
        const firstName = `User${i}`;
        const lastName = `Test${i}`;
        // Fake uniqueness for fiscal code to check bulk insert logic if we had constraints
        const fiscalCode = `TEST${i}${randomString(11).toUpperCase()}`;
        const email = `user${i}@example.com`;
        const phone = `333${Math.floor(Math.random() * 10000000)}`;
        const dob = randomDate();
        const address = `Via Test ${i}`;

        rows.push(`${firstName},${lastName},${fiscalCode},${email},${phone},${dob},${address}`);
    }

    fs.writeFileSync(path.resolve(process.cwd(), OUT_FILE), rows.join('\n'));
    console.log(`Generated ${COUNT} records in ${OUT_FILE}`);
}

generate();
