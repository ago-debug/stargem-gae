import mysql from "mysql2/promise";

const host = process.env.DB_HOST || "corsi.abreve.it";
const user = process.env.DB_USER || "admincourse";
const password = process.env.DB_PASSWORD || "L#oa8t6d&n9zgKjO";
const database = process.env.DB_NAME || "course";

async function migrate() {
    const connection = await mysql.createConnection({
        host,
        user,
        password,
        database,
    });

    try {
        console.log("Adding photo_url column to members table...");
        await connection.query("ALTER TABLE members ADD COLUMN photo_url TEXT;");
        console.log("Success!");
    } catch (err: any) {
        if (err.code === "ER_DUP_COLUMN_NAME") {
            console.log("Column already exists.");
        } else {
            console.error("Migration failed:", err.message);
        }
    } finally {
        await connection.end();
    }
}

migrate();
