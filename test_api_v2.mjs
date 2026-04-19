import fetch from 'node-fetch';

async function run() {
  let cookie = '';
  // Admin login
  const adminRes = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'gaetano', password: 'password' })
  });
  const adminCookie = adminRes.headers.get('set-cookie');
  if (adminCookie) cookie = adminCookie.split(';')[0];
  
  if (!cookie) { console.log('Login failed'); return; }

  // Get dipendenti
  const dipRes = await fetch('http://localhost:5001/api/gemteam/dipendenti', { headers: { Cookie: cookie } });
  const dipendenti = await dipRes.json();
  const targetDip = dipendenti.find(d => !d.nome.startsWith('BOT') && d.nome !== 'SYS');
  if (!targetDip) { console.log('Nessun dipendente trovato'); return; }
  
  const empId = targetDip.id;
  console.log(`Utilizzo dipendente: ${targetDip.nome} ${targetDip.cognome} (ID: ${empId})`);

  // FIX 3: POST
  console.log("\n--- TEST FIX 3: POST /api/gemteam/turni/scheduled ---");
  const postRes = await fetch('http://localhost:5001/api/gemteam/turni/scheduled', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      employeeId: empId,
      data: '2026-04-19',
      oraInizio: '08:00',
      oraFine: '13:00',
      postazione: 'RECEPTION',
      note: 'Test bot via script'
    })
  });
  
  console.log("Status:", postRes.status);
  console.log("Body:", await postRes.text());

  // Get turns to find ID for patching
  const turnsRes = await fetch('http://localhost:5001/api/gemteam/turni/scheduled', { headers: { Cookie: cookie } });
  const turns = await turnsRes.json();
  const myTurn = turns.find(t => t.employeeId === empId && t.data === '2026-04-19');

  if (!myTurn) { console.log('Turno appena creato NON TROVATO!'); return; }

  // FIX 4: PATCH
  console.log(`\n--- TEST FIX 4: PATCH /api/gemteam/turni/scheduled/${myTurn.id} ---`);
  const patchRes = await fetch(`http://localhost:5001/api/gemteam/turni/scheduled/${myTurn.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      oraInizio: '09:00',
      oraFine: '14:00',
      postazione: 'ADMIN'
    })
  });
  
  console.log("Status:", patchRes.status);
  console.log("Body:", await patchRes.text());
}

run();
