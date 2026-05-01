import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

// Helper to convert Excel date to MySQL DATE string
function toMysqlDate(val) {
    if (!val) return null;
    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569)*86400*1000));
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
}

// Clean text
function text(val) {
    return val ? String(val).trim() : null;
}

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  try {
      console.log("Loading members...");
      const [dbMembers] = await connection.execute(`SELECT id, fiscal_code, first_name, last_name FROM members`);
      const memberByFC = new Map();
      const memberByName = new Map();
      
      dbMembers.forEach(m => {
          if (m.fiscal_code) memberByFC.set(m.fiscal_code.toUpperCase(), m.id);
          if (m.first_name && m.last_name) memberByName.set(`${m.first_name.toUpperCase()}_${m.last_name.toUpperCase()}`, m.id);
      });

      console.log("Parsing Bitrix Master file for Phase 2...");
      const wb1 = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
      const data1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { defval: null });

      const updates = [];
      const adminNotesMap = new Map();

      for (const row of data1) {
          let fc = row['an_cod_fiscale'] ? String(row['an_cod_fiscale']).trim().toUpperCase() : null;
          let name = row['an_nome'] ? String(row['an_nome']).trim() : null;
          let surname = row['an_cognome'] ? String(row['an_cognome']).trim() : null;
          
          let memberId = fc ? memberByFC.get(fc) : null;
          if (!memberId && name && surname) memberId = memberByName.get(`${name.toUpperCase()}_${surname.toUpperCase()}`);
          if (!memberId) continue;
          
          // Map Native Fields
          const dob = toMysqlDate(row['an2_data_di_nascita']);
          const pob = text(row['an2_luogo_di_nascita']);
          const provob = text(row['an2_provincia_di_nascita']);
          const email = text(row['an_email']);
          const phone = text(row['an_telefono']);
          const street = text(row['an_indirizzo']);
          const cap = text(row['an_cap']);
          const city = text(row['an_citta']);
          const prov = text(row['an_provincia']);
          
          // Store entire row in JSON
          const rawData = JSON.stringify(row);
          
          updates.push([
              dob, pob, provob, email, phone, street, cap, city, prov, rawData, memberId
          ]);
      }

      console.log(`Executing ${updates.length} updates for Bitrix data...`);
      for (const u of updates) {
          await connection.execute(`
              UPDATE members 
              SET 
                  date_of_birth = IFNULL(date_of_birth, ?),
                  place_of_birth = IFNULL(place_of_birth, ?),
                  birth_province = IFNULL(birth_province, ?),
                  email = IFNULL(email, ?),
                  phone = IFNULL(phone, ?),
                  street_address = IFNULL(street_address, ?),
                  postal_code = IFNULL(postal_code, ?),
                  city = IFNULL(city, ?),
                  province = IFNULL(province, ?),
                  admin_notes = ?
              WHERE id = ?
          `, u);
      }

      // Add Elenco Iscrizioni Native fields (Mother, Father, etc.)
      console.log("Parsing Elenco Iscrizioni for Phase 2...");
      const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
      const dataA = xlsx.utils.sheet_to_json(wbA.Sheets[wbA.SheetNames[0]], { header: "A", defval: null });

      const updatesA = [];
      for (let i = 1; i < dataA.length; i++) {
          const row = dataA[i];
          let fc = row['F'] ? String(row['F']).trim().toUpperCase() : null;
          let memberId = fc ? memberByFC.get(fc) : null;
          if (!memberId) continue;
          
          // "Z" is Dati Genitore
          const genitore = text(row['Z']); 
          // "AB" is Dati Famiglia
          const famiglia = text(row['AB']);
          // "AD" is Dati Lavoro
          const lavoro = text(row['AD']);

          // Let's just append this to notes, since extracting mother/father from free text is impossible.
          const elencoData = JSON.stringify({
              dati_genitore: genitore,
              dati_famiglia: famiglia,
              dati_lavoro: lavoro
          });

          await connection.execute(`
              UPDATE members 
              SET notes = CONCAT(IFNULL(notes, ''), '\n[Dati Elenco Iscrizioni]\n', ?)
              WHERE id = ?
          `, [elencoData, memberId]);
      }

      console.log("SUCCESS! Phase 2 (Members enrich) completed.");

  } catch (err) {
      console.error("FAILED.", err);
  } finally {
      await connection.end();
  }
}
main().catch(console.error);
