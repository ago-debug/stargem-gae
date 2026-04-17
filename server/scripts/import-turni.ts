import * as XLSX from "xlsx";

export function parseTurniXlsx(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const employeeMap: Record<string, number> = {
    'ALEXANDRA': 1, 'GIUDITTA': 2, 'ESTEFANY': 3,
    'NURA': 4, 'JOEL': 5, 'KEVIN': 6, 'JASIR': 7,
    'DIEGO': 8, 'SARA': 9, 'SANTO': 10, 'MASSI': 11
  };
  
  const dayMap: Record<string, number> = {
    'LUNEDÌ': 0, 'MARTEDÌ': 1, 'MERCOLEDÌ': 2, 'GIOVEDÌ': 3,
    'VENERDÌ': 4, 'SABATO': 5, 'DOMENICA': 6
  };
  
  const results: any[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const parts = sheetName.split(' ');
    if (parts.length < 2) continue;
    
    let dayNameRaw = parts[0].toUpperCase();
    // Normalize accent for LUNEDÌ/MARTEDÌ/VENERDÌ if written differently
    if (dayNameRaw === "LUNEDI") dayNameRaw = "LUNEDÌ";
    if (dayNameRaw === "LUNEDI'") dayNameRaw = "LUNEDÌ";
    if (dayNameRaw === "MARTEDI") dayNameRaw = "MARTEDÌ";
    if (dayNameRaw === "MARTEDI'") dayNameRaw = "MARTEDÌ";
    if (dayNameRaw === "MERCOLEDI") dayNameRaw = "MERCOLEDÌ";
    if (dayNameRaw === "GIOVEDI") dayNameRaw = "GIOVEDÌ";
    if (dayNameRaw === "VENERDI") dayNameRaw = "VENERDÌ";
    if (dayNameRaw === "VENERDI'") dayNameRaw = "VENERDÌ";
    
    const settimana = parts[1].toUpperCase();
    if (!['A', 'B', 'C', 'D', 'E'].includes(settimana)) continue;
    
    const dayNum = dayMap[dayNameRaw];
    if (dayNum === undefined) continue;
    
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length < 2) continue;
    const headerRow = data[1] as any[];
    
    for (let r = 2; r < data.length; r++) {
      const row = data[r] as any[];
      if (!row || row.length === 0) continue;
      
      const rawTime = row[0];
      if (rawTime === undefined || rawTime === null) continue;
      
      let timeStr = "";
      if (typeof rawTime === 'number') {
        const totalMins = Math.round(rawTime * 24 * 60);
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } else {
        timeStr = String(rawTime).trim().substring(0, 5);
      }
      
      if (!timeStr || timeStr.length < 5 || !timeStr.includes(':')) continue;
      
      for (let col = 1; col < headerRow.length; col++) {
        const empRaw = headerRow[col];
        if (!empRaw || typeof empRaw !== 'string') continue;
        
        const empName = empRaw.toUpperCase().trim();
        const empId = employeeMap[empName];
        if (!empId) continue;
        
        const postazioneRaw = row[col];
        if (!postazioneRaw || typeof postazioneRaw !== 'string') continue;
        const postazione = postazioneRaw.toUpperCase().trim();
        
        if (postazione === 'PAUSA' || postazione === '' || postazione === 'RIPOSO') continue;
        
        let oraFineH = parseInt(timeStr.split(':')[0], 10);
        let oraFineM = parseInt(timeStr.split(':')[1], 10) + 30;
        if (oraFineM >= 60) {
          oraFineM -= 60;
          oraFineH += 1;
        }
        const oraFineStr = `${String(oraFineH).padStart(2, '0')}:${String(oraFineM).padStart(2, '0')}`;
        
        results.push({
          employee_id: empId,
          settimana_tipo: settimana,
          giorno_settimana: dayNum,
          ora_inizio: timeStr,
          ora_fine: oraFineStr,
          ora_slot: timeStr,  // kept for backwards compat with user prompt
          postazione: postazione
        });
      }
    }
  }
  
  // Raggruppa i blocchi di 30 minuti consecutivi con la stessa postazione in un unico turno
  const raggruppati: any[] = [];
  
  // Raggruppiamo prima per employee, settimana, giorno
  const keys = new Set(results.map(r => `${r.employee_id}_${r.settimana_tipo}_${r.giorno_settimana}`));
  for (const k of Array.from(keys)) {
     const slots = results.filter(r => `${r.employee_id}_${r.settimana_tipo}_${r.giorno_settimana}` === k)
          .sort((a,b) => a.ora_inizio.localeCompare(b.ora_inizio));
     
     if (slots.length === 0) continue;
     
     let current = { ...slots[0] };
     for (let i = 1; i < slots.length; i++) {
        const slot = slots[i];
        if (slot.postazione === current.postazione && current.ora_fine === slot.ora_inizio) {
           current.ora_fine = slot.ora_fine;
        } else {
           raggruppati.push(current);
           current = { ...slot };
        }
     }
     raggruppati.push(current);
  }
  
  // Se vogliamo l'output raw da 30min possiamo restituire results, se vogliamo raggruppati restituiamo raggruppati.
  // L'engine UI e MySQL apprezza i raggruppati per evitare 4000 righe e compattare "08:30-14:30".
  return raggruppati;
}
