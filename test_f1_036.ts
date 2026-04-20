import "dotenv/config";

async function runTest() {
  const cookieHeader = await (async () => {
    console.log("=== STEP 1: LOGIN come botAI ===");
    const res = await fetch("http://localhost:5001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "botAI", password: "botAI123!" })
    });
    console.log(`HTTP ${res.status}`);
    const body = await res.json();
    console.log("Payload:", body);
    if (!res.ok) throw new Error("Login fallito");
    return res.headers.get("set-cookie")?.split(";")[0] || "";
  })();

  const fetchApi = async (url: string, method = "GET", bodyObj?: any) => {
    const res = await fetch(`http://localhost:5001${url}`, {
      method,
      headers: { 
        "Cookie": cookieHeader,
        "Content-Type": "application/json"
      },
      body: bodyObj ? JSON.stringify(bodyObj) : undefined
    });
    console.log(`HTTP ${res.status}`);
    try {
      const data = await res.json();
      console.log("Payload:", data);
      return data;
    } catch {
      const text = await res.text();
      console.log("Payload text:", text);
      return text;
    }
  };

  console.log("\n=== STEP 2: GET /api/gemteam/dipendenti ===");
  const dipendenti = await fetchApi("/api/gemteam/dipendenti");
  
  // Trovo ID botAI
  // botAI non è tecnicamente un dipendente (non in teamEmployees), o forse sì?
  // Se non lo è, dovremo usare il parameter dummy employee_id o il backend darà errore se cerchiamo di loggarlo in sede.
  // Negli step richiesti si dice "POST /api/gemteam/checkin — simula entrata in sede".
  // Se checkin si aspetta employee_id, proveremo string "botAI" o suo id, ma il body richiesto di norma è json "{ tipo, employee_id }".
  // La route /api/gemteam/checkin potrebbe usare `req.user.employeeId` o richiedere un param nel body?
  // Vediamo cosa lancia. Nel dubbio metto null per employee_id oppure l'id uuid se viene accettato
  console.log("\n=== STEP 3: POST /api/gemteam/checkin (IN) ===");
  await fetchApi("/api/gemteam/checkin", "POST", { tipo: "IN", employee_id: 16 });

  console.log("\n=== STEP 4: GET /api/gemteam/checkin/status/16 ===");
  await fetchApi("/api/gemteam/checkin/status/16");

  console.log("\n=== STEP 5: POST /api/gemteam/diario ===");
  await fetchApi("/api/gemteam/diario", "POST", {
    employee_id: 16,
    attivita_libera: "Test F1-036 e2e",
    ore_impiegate: 1.5,
    data: new Date().toISOString()
  });

  console.log("\n=== STEP 6: GET /api/gemteam/turni/scheduled?data=oggi ===");
  await fetchApi("/api/gemteam/turni/scheduled?data=oggi");

  console.log("\n=== STEP 7: POST /api/gemteam/turni/scheduled (deve fallire) ===");
  await fetchApi("/api/gemteam/turni/scheduled", "POST", {
    employeeId: 16,
    data: new Date().toISOString(),
    oraInizio: "09:00",
    oraFine: "10:00",
    postazione: "MALATTIA"
  });

  console.log("\n=== STEP 8: POST /api/gemteam/checkin (OUT) ===");
  await fetchApi("/api/gemteam/checkin", "POST", { tipo: "OUT", employee_id: 16 });

  console.log("\n=== STEP 9: Verifica DB manuale non necessaria se vediamo i JSON ===");
  
  process.exit(0);
}
runTest().catch(console.error);
