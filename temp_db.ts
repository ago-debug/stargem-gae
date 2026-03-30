import { createConnection } from "mysql2/promise";

async function main() {
    try {
        const connection = await createConnection("mysql://studiogemadmin:Admin25041970_@alessandromagno.abreve.it:3306");
        console.log("Connected successfully to DB Server!");
        
        const [grants] = await connection.query("SHOW GRANTS;");
        console.log("GRANTS:", grants);
        
        const [dbs] = await connection.query("SHOW DATABASES;");
        console.log("DATABASES:", dbs);
        
        await connection.end();
    } catch (err: any) {
        console.error("Error connected:", err.message);
    }
}

main();
