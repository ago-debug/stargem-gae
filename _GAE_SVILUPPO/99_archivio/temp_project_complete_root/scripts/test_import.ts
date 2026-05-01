
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5005/api/import';
const FILE_PATH = 'large_members.csv';
const BOUNDARY = '--------------------------735323031399963166993862';

async function runTest() {
    try {
        const fileContent = fs.readFileSync(path.resolve(process.cwd(), FILE_PATH));

        // Construct multipart body manually to avoid 'form-data' dependency
        const pre = Buffer.from(
            `--${BOUNDARY}\r\n` +
            `Content-Disposition: form-data; name="type"\r\n\r\n` +
            `members\r\n` +
            `--${BOUNDARY}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="large_members.csv"\r\n` +
            `Content-Type: text/csv\r\n\r\n`
        );
        const post = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);
        const body = Buffer.concat([pre, fileContent, post]);

        console.log('Starting upload...');
        const start = Date.now();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
                // Mock session cookie if needed, but assuming dev env might pass
                // or check how to bypass auth.
                // For now, if it fails 401, we know we need a session.
                'Cookie': 'connect.sid=s%3Atest'
            },
            body: body
        });

        const duration = Date.now() - start;
        console.log(`Upload finished in ${duration}ms`);

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', text);

    } catch (err: any) {
        console.error('Import failed:', err.message);
    }
}

runTest();
