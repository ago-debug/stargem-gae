import mysql from 'mysql2/promise';
async function run() {
  const conn = await mysql.createConnection("mysql://studiogemadmin:Admin25041970_@alessandromagno.abreve.it:3306/sg_gae");
  const [rows] = await conn.query("DESCRIBE strategic_events;");
  console.log(rows);
  await conn.end();
}
run().catch(e => console.error(e));
