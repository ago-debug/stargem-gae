import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  const [rows] = await connection.execute("SELECT cli.value, cli.color, cli.active FROM custom_list_items cli JOIN custom_lists cl ON cl.id = cli.list_id WHERE cl.system_name = 'stato_corso' ORDER BY cli.sort_order;");
  console.log(rows);
  await connection.end();
}
main().catch(console.error);
