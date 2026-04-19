const fetch = require('node-fetch');

async function test() {
  const turniStr = '[{"id":1,"employeeId":5,"data":"2026-04-18T00:00:00.000Z","oraInizio":"08:00:00","oraFine":"08:30:00","postazione":"MALATTIA","note":"","firstName":"JOEL","lastName":"VILLON","displayOrder":5,"team":"segreteria","assenzaRegistrata":null,"hasConflict":false}]';
  const turniScheduled = JSON.parse(turniStr);
  
  const dipendentiStr = '[{"id":5,"memberId":9113,"userId":"dcab95ba-7b26-444a-912f-9dfb5fa4b407","displayOrder":5,"team":"segreteria","tariffaOraria":null,"stipendioFissoMensile":"1500.00","dataAssunzione":"2023-01-10T00:00:00.000Z","attivo":true,"noteHr":null,"firstName":"JOEL","lastName":"VILLON"}]';
  const dipendenti = JSON.parse(dipendentiStr).map(d => ({
    id: d.id,
    team: d.team,
    nome: d.firstName
  }));
  
  const hour = "08:00";
  const dip = dipendenti[0]; // Joel
  
  const turniFiltrato = Array.isArray(turniScheduled) ? turniScheduled.find((t) => t.employeeId === dip.id && t.oraInizio?.substring(0,5) === hour) : null;
  console.log("Match:", turniFiltrato);
}
test();
