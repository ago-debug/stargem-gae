
import mysql from 'mysql2/promise';
async function test() {
    try {
        const connection = await mysql.createConnection({
            host: 'corsi.abreve.it',
            user: 'admincourse',
            password: 'L#oa8t6d&n9zgKjO',
            database: 'course'
        });
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM members');
        console.log('Member count:', rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}
test();
