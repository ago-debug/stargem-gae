fetch("http://localhost:5001/api/gemteam/turni/scheduled/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    employeeId: 1,
    data: "2026-04-19",
    oraInizio: "09:00",
    oraFine: "10:00",
    postazione: "CAMPUS"
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
});
