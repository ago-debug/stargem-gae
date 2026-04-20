import "dotenv/config";

async function run() {
  const loginRes = await fetch("http://localhost:5001/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "botAI", password: "botAI123!" })
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

  console.log("Eseguo check-out per il Bot...");
  const outRes = await fetch("http://localhost:5001/api/gemteam/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({ tipo: "OUT", employee_id: 16 })
  });
  console.log("Check-in OUT HTTP:", outRes.status, await outRes.text());
  
  process.exit(0);
}

run().catch(console.error);
