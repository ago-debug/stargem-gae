import mysql from 'mysql2/promise';
async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'gaetano_admin', password: 'StarGem2026!Secure', database: 'stargem_v2',
  });
  try {
    await connection.execute(`ALTER TABLE members ADD COLUMN user_id VARCHAR(255) NULL;`);
    console.log("Colonna user_id aggiunta a members.");
  } catch(e: any) {
    console.error(e.message);
  }
  await connection.end();
}
run();
