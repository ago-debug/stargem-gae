import { createConnection } from "mysql2/promise";

async function main() {
  let connection;
  try {
    console.log("Tentativo di connessione al database stargem_v2...");
    
    connection = await createConnection({
      host: "82.165.35.145",
      port: 3306,
      user: "gaetano_admin",
      password: "StarGem2026!Secure",
      database: "stargem_v2"
    });

    console.log("✅ 1. Connessione riuscita? SÌ");

    // Verifica numero tabelle
    const [tables]: any = await connection.query("SHOW TABLES");
    console.log(`📊 2. Numero di tabelle nel database: ${tables.length}`);

    // Verifica numero record in members (potrebbe dare errore se la tabella non esiste nel nuovo DB vuoto)
    try {
      const [members]: any = await connection.query("SELECT COUNT(*) AS count FROM members");
      console.log(`👥 3. Record nella tabella 'members': ${members[0].count}`);
    } catch (err: any) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.log("👥 3. Record nella tabella 'members': 0 (La tabella non esiste ancora in questo DB vuoto)");
      } else {
        console.log(`👥 3. Errore lettura tabella 'members': ${err.message}`);
      }
    }

  } catch (err: any) {
    console.log("❌ 1. Connessione riuscita? NO");
    console.error("Errore di connessione:", err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
