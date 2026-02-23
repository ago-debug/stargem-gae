import "dotenv/config";
import mysql from "mysql2/promise";

async function checkStudiosSchema() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    try {
        const [rows] = await connection.query("DESCRIBE studios") as any;
        console.log("Columns in 'studios' table:");
        rows.forEach((row: any) => {
            console.log(`- ${row.Field} (${row.Type})`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStudiosSchema();
