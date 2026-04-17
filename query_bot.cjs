const { createConnection } = require("mysql2/promise");
async function run() {
  const db = await createConnection(process.env.DATABASE_URL);
  const [rows] = await db.query("SELECT * FROM users WHERE username LIKE \"%bot%\"");
  console.log(rows);
  process.exit(0);
}
run();
