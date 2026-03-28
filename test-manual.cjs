const mysql = require('mysql2/promise');

async function test() {
  try {
     const pool = mysql.createPool({ uri: "mysql://studiogemadmin:Admin25041970_@alessandromagno.abreve.it:3306/sg_gae" });
     const [result] = await pool.query(
        "INSERT INTO strategic_events (title, event_type, start_date, all_day) VALUES (?, ?, ?, ?)",
        ["Ferie Agosto 26", "ferie", "2026-08-10", 1]
     );
     console.log("Inserimento avvenuto:", result);
     
     const [rows] = await pool.query("SELECT * FROM strategic_events WHERE id = ?", [result.insertId]);
     console.log("Record ritornato:", rows[0]);
     pool.end();
  } catch(err) {
     console.error("SQL ERROR PURISSIMO:", err.message);
  }
}
test();
