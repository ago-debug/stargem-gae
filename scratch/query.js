const { drizzle } = require("drizzle-orm/mysql2");
const mysql = require("mysql2/promise");

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost', // Assuming dev server env if it's there? wait 127.0.0.1
        port: 3306,
        user: 'root',
        password: '',
        database: 'stargem_v2'
    });
    const [rows] = await connection.query("SELECT id, name, active, startDate, endDate, seasonId, dayOfWeek, instructorId, studioId, categoryId, startTime, endTime FROM courses ORDER BY id DESC LIMIT 5");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}
run();
