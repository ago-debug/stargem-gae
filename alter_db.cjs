const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'gaetano_admin',
      password: 'Verona2026stargem2026',
      database: 'stargem_v2'
    });

    // Check if column exists
    const [cols] = await connection.execute("SHOW COLUMNS FROM courses LIKE 'total_occurrences'");
    if (cols.length === 0) {
       await connection.execute("ALTER TABLE courses ADD COLUMN total_occurrences INT DEFAULT NULL;");
       console.log("Column added.");
    } else {
       console.log("Column already exists.");
    }
    
    await connection.end();
  } catch(e) {
    console.error(e);
  }
}

main();
