const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  const ids = [14181, 17092, 16645, 15116];
  for (const id of ids) {
    const [members] = await connection.execute('SELECT first_name, last_name, medical_certificate_expiry FROM members WHERE id = ?', [id]);
    const [certs] = await connection.execute('SELECT expiry_date, status FROM medical_certificates WHERE member_id = ? ORDER BY expiry_date DESC LIMIT 1', [id]);
    
    const member = members[0];
    const cert = certs.length > 0 ? certs[0] : null;
    
    console.log(`\n--- Membro ID: ${id} (${member?.first_name} ${member?.last_name}) ---`);
    console.log(`medical_certificate_expiry (tabella members): ${member?.medical_certificate_expiry}`);
    console.log(`Tabella medical_certificates: ${cert ? `Scadenza: ${cert.expiry_date}, Status: ${cert.status}` : 'Nessun record'}`);
  }
  
  await connection.end();
}

main().catch(console.error);
