import { createConnection } from "mysql2/promise";

async function main() {
    try {
        const connection = await createConnection("mysql://studiogemadmin:Admin25041970_@alessandromagno.abreve.it:3306");
        
        console.log("Connected to MySQL successfully!");
        
        const [grants] = await connection.query("SHOW GRANTS;");
        console.log("Grants:", grants);
        
        const [dbs] = await connection.query("SHOW DATABASES;");
        console.log("Databases:", dbs);
        
        await connection.end();
    } catch (err) {
        console.error("Error connecting to DB:", err.message);
    }
}
main();
