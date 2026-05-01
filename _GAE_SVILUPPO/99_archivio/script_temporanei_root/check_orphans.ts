import { db } from './server/db.js';
import { teamScheduledShifts, teamEmployees } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

async function checkShifts() {
  const shifts = await db.select().from(teamScheduledShifts);
  const team = await db.select().from(teamEmployees);
  
  const teamMap = new Map();
  team.forEach(t => teamMap.set(t.id, t));

  let orphans = 0;
  let orphansDueToEmployeeNotFound = 0;
  let orphansDueToEmployeeInactive = 0;
  let visibleActive = 0;
  
  const shiftsDetails = [];

  for (const s of shifts) {
    const emp = teamMap.get(s.employeeId);
    let status = "VISIBLE";
    if (!emp) {
      status = "ORPHAN (Dipendente Eliminato)";
      orphans++;
      orphansDueToEmployeeNotFound++;
    } else if (!emp.attivo) {
      status = "HIDDEN (Dipendente Inattivo)";
      orphans++;
      orphansDueToEmployeeInactive++;
    } else {
      visibleActive++;
    }
    
    shiftsDetails.push({
      id: s.id,
      dipendente: emp ? `${emp.firstName} ${emp.lastName}` : `ID=${s.employeeId}`,
      data: s.data,
      orario: `${s.oraInizio} - ${s.oraFine}`,
      postazione: s.postazione,
      status
    });
  }
  
  console.log("=== REPORT TURNI NEL DATABASE ===");
  console.log(`Totale Turni in DB: ${shifts.length}`);
  console.log(`Turni Visibili (Dipendente Attivo): ${visibleActive}`);
  console.log(`Turni Orfani o Nascosti: ${orphans}`);
  console.log(` - Dipendente non trovato: ${orphansDueToEmployeeNotFound}`);
  console.log(` - Dipendente disattivato: ${orphansDueToEmployeeInactive}`);
  console.log("\nLista Turni:");
  shiftsDetails.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime() || a.dipendente.localeCompare(b.dipendente));
  shiftsDetails.forEach(sd => {
     console.log(`[${sd.status}] ${typeof sd.data === 'string' ? sd.data : (sd.data ? sd.data.toISOString().split('T')[0] : 'NO_DATE')} | ${sd.dipendente} | ${sd.orario} | ${sd.postazione}`);
  });
  
  process.exit(0);
}

checkShifts().catch(console.error);
