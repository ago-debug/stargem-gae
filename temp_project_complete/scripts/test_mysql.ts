import mysql from "mysql2/promise";

async function testConnection() {
    console.log("Attempting to connect to MySQL on corsi.abreve.it:3306...");
    try {
        const connection = await mysql.createConnection({
            host: "corsi.abreve.it",
            user: "admincourse",
            password: "L#oa8t6d&n9zgKjO",
            database: "course",
            connectTimeout: 10000 // 10 seconds
        });
        console.log("SUCCESS: Connected to MySQL!");
        await connection.end();
    } catch (err: any) {
        console.error("CONNECTION FAILED:");
        console.error(err);
    }
}

testConnection();
