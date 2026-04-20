const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    uri: "mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2",
    connectionLimit: 1
  });
  
  const [rows] = await pool.query("SELECT * FROM team_scheduled_shifts LIMIT 1");
  console.log("Current record:", rows[0]);
  
  if (rows.length > 0) {
    const id = rows[0].id;
    try {
      await pool.query("UPDATE team_scheduled_shifts SET ora_inizio = ?, updated_at = NOW() WHERE id = ?", ['10:30', id]);
      console.log("Success updating via raw sql!");
      
      const [res] = await pool.query("SELECT * FROM team_scheduled_shifts WHERE id = ?", [id]);
      console.log("Updated record:", res[0]);
    } catch(e) {
      console.error(e);
    }
  }
  process.exit(0);
}
test();
