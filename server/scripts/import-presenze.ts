import * as XLSX from "xlsx";

export function parsePresenzeXlsx(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const employeeMap: Record<string, number> = {
    'ALEXANDRA': 1, 'GIUDITTA': 2, 'ESTEFANY': 3,
    'NURA': 4, 'JOEL': 5, 'KEVIN': 6, 'JASIR': 7,
    'DIEGO': 8, 'SARA': 9, 'SANTO': 10, 'MASSI': 11
  };
  
  const results: any[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Look for header row (contains names)
    // Foglio struttura: data a sinistra (spesso colonna 0 o 1), dipendenti nelle successive.
    // L'utente dice: "Ogni foglio: righe=date, colonne=dipendenti"
    
    let headerRowIndex = -1;
    for (let r = 0; r < 20; r++) {
       if (data[r] && (data[r] as any[]).some(c => typeof c === 'string' && employeeMap[c.toUpperCase().trim()])) {
          headerRowIndex = r;
          break;
       }
    }
    
    if (headerRowIndex === -1) continue;
    const headerRow = data[headerRowIndex] as any[];
    
    for (let r = headerRowIndex + 1; r < data.length; r++) {
      const row = data[r] as any[];
      if (!row || row.length === 0) continue;
      
      const rawDate = row[0] || row[1]; // Often date is in first col, maybe second if A is empty
      let dateObj: Date | null = null;
      
      if (typeof rawDate === 'number') {
        // Excel serial date starting from 1900
        dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
      } else if (rawDate instanceof Date) {
        dateObj = rawDate;
      } else if (typeof rawDate === 'string') {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) dateObj = parsed;
      }
      
      if (!dateObj || isNaN(dateObj.getTime())) continue;
      
      // format to YYYY-MM-DD
      const dateStr = dateObj.toISOString().split('T')[0];
      
      for (let col = 1; col < headerRow.length; col++) {
        const empRaw = headerRow[col];
        if (!empRaw || typeof empRaw !== 'string') continue;
        
        const empName = empRaw.toUpperCase().trim();
        const empId = employeeMap[empName];
        if (!empId) continue;
        
        const cellVal = row[col];
        if (cellVal === undefined || cellVal === null || cellVal === '') continue;
        
        let ore = 0;
        let tipo: string | null = null;
        
        if (typeof cellVal === 'number') {
           ore = cellVal;
        } else if (typeof cellVal === 'string') {
           const sVal = cellVal.toUpperCase().trim();
           if (['ML', 'PE', 'FE', 'F', 'AI'].includes(sVal)) {
              tipo = sVal;
              ore = 0;
           } else {
              const floatVal = parseFloat(cellVal.replace(',','.'));
              if (!isNaN(floatVal)) {
                  ore = floatVal;
              } else {
                  continue; // unrecognised string
              }
           }
        }
        
        // Skip if 0 and not absent
        if (ore === 0 && !tipo) continue;
        
        results.push({
          employee_id: empId,
          data: dateStr,
          ore_lavorate: ore,
          tipo_assenza: tipo
        });
      }
    }
  }
  
  return results;
}
