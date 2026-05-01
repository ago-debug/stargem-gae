import { readSpreadsheet } from "./google-sheets";
import { storage } from "./storage";

async function updateMembersEmailPhone() {
  const spreadsheetId = "1RGHlAF488FerC6ufu2AZKkKU_KqDIrYSBCjyFVZnAS4";
  const limit = 500;
  
  console.log("Reading data from Google Sheets...");
  
  const rows = await readSpreadsheet(spreadsheetId, "A1:AZ501");
  
  if (rows.length < 2) {
    console.log("No data found in spreadsheet");
    return;
  }

  console.log(`Found ${rows.length - 1} rows (excluding header)`);

  const headers = rows[0].map((h: string) => h?.toLowerCase().trim() || "");
  const dataRows = rows.slice(1, Math.min(rows.length, limit + 1));

  const findColumn = (possibleNames: string[], exactMatch = false): number => {
    for (const name of possibleNames) {
      const idx = headers.findIndex((h: string) => {
        if (exactMatch) {
          return h === name.toLowerCase();
        }
        return h.includes(name.toLowerCase());
      });
      if (idx !== -1) {
        console.log(`Found column "${name}" at index ${idx} (header: "${headers[idx]}")`);
        return idx;
      }
    }
    return -1;
  };

  const colFiscalCode = findColumn(["codice_fiscale"]);
  const colEmail = findColumn(["e-mail"], true);
  const colEmail2 = findColumn(["e-mail 2"]);
  const colCellulare = findColumn(["cellulare"], true);
  const colTelefono = findColumn(["telefono"], true);

  console.log(`\nColumn mapping: FiscalCode=${colFiscalCode}, Email=${colEmail}, Email2=${colEmail2}, Cellulare=${colCellulare}, Telefono=${colTelefono}`);

  const existingMembers = await storage.getMembers();
  const membersByFiscalCode = new Map<string, any>();
  existingMembers.forEach(m => {
    if (m.fiscalCode) {
      membersByFiscalCode.set(m.fiscalCode.toUpperCase(), m);
    }
  });

  console.log(`\nExisting members with fiscal code: ${membersByFiscalCode.size}`);

  const formatPhone = (phone: string): string => {
    if (!phone) return "";
    let cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
    if (cleaned.startsWith("00")) {
      cleaned = "+" + cleaned.substring(2);
    }
    if (!cleaned.startsWith("+") && cleaned.length >= 9) {
      cleaned = "+39" + cleaned;
    }
    return cleaned;
  };

  let updated = 0;
  let notFound = 0;
  let noChanges = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    const getValue = (colIdx: number): string => {
      if (colIdx < 0 || colIdx >= row.length) return "";
      return (row[colIdx] || "").toString().trim();
    };

    const fiscalCode = getValue(colFiscalCode).toUpperCase();
    
    if (!fiscalCode) {
      notFound++;
      continue;
    }

    const member = membersByFiscalCode.get(fiscalCode);
    if (!member) {
      notFound++;
      continue;
    }

    const email = getValue(colEmail) || getValue(colEmail2);
    const cellulare = formatPhone(getValue(colCellulare));
    const telefono = formatPhone(getValue(colTelefono));

    const updates: any = {};
    let hasChanges = false;

    if (email && !member.email) {
      updates.email = email;
      hasChanges = true;
    }

    if (cellulare && member.mobile !== cellulare) {
      updates.mobile = cellulare;
      hasChanges = true;
    }

    if (telefono && member.phone !== telefono) {
      updates.phone = telefono;
      hasChanges = true;
    }

    if (hasChanges) {
      await storage.updateMember(member.id, updates);
      updated++;
    } else {
      noChanges++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  Processed ${i + 1}/${dataRows.length} rows...`);
    }
  }

  console.log("\n=== Update Complete ===");
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`No changes needed: ${noChanges}`);
}

updateMembersEmailPhone()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Update failed:", err);
    process.exit(1);
  });
