import fetch from 'node-fetch';

async function testPOST() {
  // Login come bot
  let cookie = '';
  // Try to find a user or login with a known account if we know the password.
  // Actually, we can just use the login api
  const loginRes = await fetch('http://localhost:5001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'stargem_bot', password: 'password123' }) // We must guess the bot password or look it up or use admin
  });
  
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }
  
  if (!cookie) {
      // Try admin
      const adminRes = await fetch('http://localhost:5001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'gaetano', password: 'password' }) // placeholder
      });
      const adminCookie = adminRes.headers.get('set-cookie');
      if (adminCookie) cookie = adminCookie.split(';')[0];
  }

  console.log("Cookie:", cookie);

  // FIX 3: Inserimento turno
  console.log("\n--- TEST FIX 3: POST /api/gemteam/turni/scheduled ---");
  const postRes = await fetch('http://localhost:5001/api/gemteam/turni/scheduled', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      employeeId: 10,
      data: '2026-04-19',
      oraInizio: '08:00',
      oraFine: '13:00',
      postazione: 'RECEPTION',
      note: 'Test bot via script'
    })
  });
  
  console.log("Status:", postRes.status);
  console.log("Body:", await postRes.text());

  // FIX 4: Modifica turno. Assumiamo di voler fare edit al turno appena creato, oppure ID 1
  console.log("\n--- TEST FIX 4: PATCH /api/gemteam/turni/scheduled/1 ---");
  const patchRes = await fetch('http://localhost:5001/api/gemteam/turni/scheduled/1', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({
      oraInizio: '09:00',
      oraFine: '14:00',
      postazione: 'ADMIN'
    })
  });
  
  console.log("Status:", patchRes.status);
  console.log("Body:", await patchRes.text());
}

testPOST();
