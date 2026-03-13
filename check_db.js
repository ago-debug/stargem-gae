const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [memberships] = await connection.execute('SELECT * FROM memberships WHERE membership_number = "2526-002074"');
  console.log("MEMBERSHIPS:", JSON.stringify(memberships, null, 2));

  if (memberships.length > 0) {
    const memberId = memberships[0].member_id;
    const [members] = await connection.execute('SELECT id, tessere_metadata FROM members WHERE id = ?', [memberId]);
    console.log("MEMBER:", JSON.stringify(members, null, 2));
  }
  
  await connection.end();
}
main().catch(console.error);
