import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
    console.log('Testing MySQL connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set in .env file');
        process.exit(1);
    }

    try {
        // Create a connection using the DATABASE_URL
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('✅ Successfully connected to MySQL!');

        // Get server version
        const [versionRows] = await connection.query('SELECT VERSION() as version') as any;
        console.log('MySQL version:', versionRows[0].version);

        // Get database name
        const [dbRows] = await connection.query('SELECT DATABASE() as db_name') as any;
        console.log('Current database:', dbRows[0].db_name || '(none selected)');

        // List existing tables (only if a database is selected)
        if (dbRows[0].db_name) {
            const [tables] = await connection.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `) as any;

            console.log('\nExisting tables:');
            if (tables.length === 0) {
                console.log('  (no tables yet - database is empty)');
            } else {
                tables.forEach((table: any) => {
                    console.log('  -', table.TABLE_NAME);
                });
            }
        }

        await connection.end();
        console.log('\n✅ Connection test completed successfully!');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Failed to connect to MySQL:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 MySQL server is not running or not accessible.');
            console.error('   Try starting MySQL with: docker-compose up -d');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Authentication failed. Check your credentials in .env');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n💡 Database does not exist. Create it first or check the name.');
        }

        process.exit(1);
    }
}

testConnection();
