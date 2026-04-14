const mysql = require("mysql2/promise");
async function test() {
  const p = "Verona2026??!!XxX_";
  try {
    const pool = mysql.createPool({ host: "127.0.0.1", port: 3306, user: "gaetano_admin", password: p, database: "stargem_v2" });
    await pool.query("SELECT 1");
    console.log("SUCCESS P1 (raw ??)");
  } catch(e) { console.log("FAIL P1", e.message); }
  
  try {
    const p2 = "Verona2026%3F%3F!!XxX_";
    const pool2 = mysql.createPool({ host: "127.0.0.1", port: 3306, user: "gaetano_admin", password: p2, database: "stargem_v2" });
    await pool2.query("SELECT 1");
    console.log("SUCCESS P2 (raw %3F%3F)");
  } catch(e) { console.log("FAIL P2", e.message); }
}
test();
