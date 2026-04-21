import mysql from "mysql2/promise";

async function run() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'stargem_v2'
    });
    const [rows] = await connection.query("SELECT id, name, active, startDate, endDate, seasonId, dayOfWeek, instructorId, studioId, categoryId FROM courses ORDER BY id DESC LIMIT 5");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}
run();
