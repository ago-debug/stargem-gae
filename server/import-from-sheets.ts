import { readSpreadsheet } from "./google-sheets";
import { storage } from "./storage";

async function importMembersFromGoogleSheets() {
  const spreadsheetId = "1RGHlAF488FerC6ufu2AZKkKU_KqDIrYSBCjyFVZnAS4";
  const limit = 500;
  
  console.log("Reading data from Google Sheets...");
  
  const rows = await readSpreadsheet(spreadsheetId, "A1:Z501");
  
  if (rows.length < 2) {
    console.log("No data found in spreadsheet");
    return;
  }

  console.log(`Found ${rows.length - 1} rows (excluding header)`);
  console.log("Header row:", rows[0]);

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

  const colFiscalCode = findColumn(["codice_fiscale", "codice fiscale", "fiscal code", "cf", "codicefiscale"]);
  const colFirstName = findColumn(["nome"], true);
  const colLastName = findColumn(["cognome"], true);
  const colEmail = findColumn(["email", "e-mail", "mail"]);
  const colPhone = findColumn(["telefono", "phone", "tel"]);
  const colMobile = findColumn(["cellulare", "mobile", "cell"]);
  const colDateOfBirth = findColumn(["data di nascita", "data nascita", "date of birth", "birth date", "nascita"]);
  const colPlaceOfBirth = findColumn(["città nasc.", "citta nasc", "luogo nascita", "luogo di nascita", "place of birth"]);
  const colGender = findColumn(["sesso"], true);
  const colStreet = findColumn(["indirizzo"], true);
  const colCity = findColumn(["citta resid.", "citta resid", "città resid.", "città resid", "city", "comune"]);
  const colProvince = findColumn(["provincia"], true);
  const colPostalCode = findColumn(["cap"], true);
  const colCardNumber = findColumn(["codice id anagrafica", "tessera", "card", "numero tessera", "card number"]);

  console.log("\nColumn mapping:");
  console.log(`  FiscalCode: ${colFiscalCode}, FirstName: ${colFirstName}, LastName: ${colLastName}`);
  console.log(`  Email: ${colEmail}, Phone: ${colPhone}, Mobile: ${colMobile}`);
  console.log(`  DateOfBirth: ${colDateOfBirth}, PlaceOfBirth: ${colPlaceOfBirth}, Gender: ${colGender}`);
  console.log(`  Street: ${colStreet}, City: ${colCity}, Province: ${colProvince}, PostalCode: ${colPostalCode}`);

  const existingMembers = await storage.getMembers();
  const existingByFiscalCode = new Map<string, number>();
  existingMembers.forEach(m => {
    if (m.fiscalCode) {
      existingByFiscalCode.set(m.fiscalCode.toUpperCase(), m.id);
    }
  });
  console.log(`\nExisting members: ${existingMembers.length}`);
  console.log(`Existing members with fiscal code: ${existingByFiscalCode.size}`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  console.log(`\nProcessing ${dataRows.length} rows...`);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    try {
      const getValue = (colIdx: number): string => {
        if (colIdx < 0 || colIdx >= row.length) return "";
        return (row[colIdx] || "").toString().trim();
      };

      const fiscalCode = getValue(colFiscalCode).toUpperCase();
      const firstName = getValue(colFirstName);
      const lastName = getValue(colLastName);

      if (!firstName && !lastName) {
        skipped++;
        continue;
      }

      const parseDate = (val: string): string | undefined => {
        if (!val) return undefined;
        const parts = val.split(/[\/\-\.]/);
        if (parts.length === 3) {
          let [a, b, c] = parts;
          if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
          if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
          if (c.length === 2) {
            const year = parseInt(c) > 50 ? `19${c}` : `20${c}`;
            return `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
          }
        }
        return undefined;
      };

      const genderRaw = getValue(colGender).toUpperCase();
      const gender = genderRaw === "M" || genderRaw === "MASCHIO" || genderRaw === "MALE" ? "M" 
                   : genderRaw === "F" || genderRaw === "FEMMINA" || genderRaw === "FEMALE" ? "F" 
                   : undefined;

      const memberData = {
        firstName: firstName || "Sconosciuto",
        lastName: lastName || "Sconosciuto",
        fiscalCode: fiscalCode || undefined,
        email: getValue(colEmail) || undefined,
        phone: getValue(colPhone) || undefined,
        mobile: getValue(colMobile) || undefined,
        dateOfBirth: parseDate(getValue(colDateOfBirth)),
        placeOfBirth: getValue(colPlaceOfBirth) || undefined,
        gender,
        streetAddress: getValue(colStreet) || undefined,
        city: getValue(colCity) || undefined,
        province: getValue(colProvince).toUpperCase().substring(0, 2) || undefined,
        postalCode: getValue(colPostalCode) || undefined,
        cardNumber: getValue(colCardNumber) || undefined,
        active: true,
      };

      if (fiscalCode && existingByFiscalCode.has(fiscalCode)) {
        const existingId = existingByFiscalCode.get(fiscalCode)!;
        await storage.updateMember(existingId, memberData);
        updated++;
      } else {
        const newMember = await storage.createMember(memberData);
        if (fiscalCode) {
          existingByFiscalCode.set(fiscalCode, newMember.id);
        }
        imported++;
      }

      if ((i + 1) % 50 === 0) {
        console.log(`  Processed ${i + 1}/${dataRows.length} rows...`);
      }
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`);
      skipped++;
    }
  }

  console.log("\n=== Import Complete ===");
  console.log(`Imported: ${imported}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${dataRows.length}`);
  
  if (errors.length > 0) {
    console.log(`\nFirst ${Math.min(10, errors.length)} errors:`);
    errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }
}

importMembersFromGoogleSheets()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
