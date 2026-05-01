import mysql from "mysql2/promise";
const pool = mysql.createPool({ uri: "mysql://gaetano_admin:Verona2026%3F%3F!!XxX_@127.0.0.1:3306/stargem_v2" });
console.log((pool as any).pool.config.connectionConfig.password);
process.exit(0);
