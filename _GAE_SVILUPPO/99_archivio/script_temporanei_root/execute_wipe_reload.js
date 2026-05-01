import mysql from 'mysql2/promise';
import xlsx from 'xlsx';
import fs from 'fs';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  console.log("Loading Excel file...");
  const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
  const sheetA = wbA.Sheets[wbA.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheetA, { header: "A", defval: null });

  console.log("Loading DB mappings...");
  // 1. Map Members
  const [dbMembers] = await connection.execute(`SELECT id, fiscal_code, first_name, last_name FROM members`);
  const memberByFC = new Map();
  const memberByName = new Map();
  
  dbMembers.forEach(m => {
      if (m.fiscal_code) {
          memberByFC.set(m.fiscal_code.trim().toUpperCase(), m.id);
      }
      if (m.first_name && m.last_name) {
          const key = `${m.last_name.trim().toUpperCase()}_${m.first_name.trim().toUpperCase()}`;
          memberByName.set(key, m.id);
      }
  });

  // 2. Map Courses
  const [dbCourses] = await connection.execute(`SELECT id, sku FROM courses WHERE sku IS NOT NULL AND sku != ''`);
  const courseBySku = new Map();
  dbCourses.forEach(c => {
      courseBySku.set(c.sku.trim().toUpperCase(), c.id);
  });

  const skipped = [];
  const inserts = [];
  
  console.log("Matching data...");
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let fc = row['F'] ? String(row['F']).trim().toUpperCase() : null;
      let surname = row['D'] ? String(row['D']).trim().toUpperCase() : null;
      let name = row['E'] ? String(row['E']).trim().toUpperCase() : null;
      let sku = row['AG'] ? String(row['AG']).trim().toUpperCase() : null;
      
      if (!sku) {
          skipped.push({ reason: "No SKU", row });
          continue;
      }
      
      let memberId = null;
      if (fc && memberByFC.has(fc)) {
          memberId = memberByFC.get(fc);
      } else if (surname && name) {
          const nameKey = `${surname}_${name}`;
          if (memberByName.has(nameKey)) {
              memberId = memberByName.get(nameKey);
          }
      }
      
      if (!memberId) {
          skipped.push({ reason: "No Member Found", fc, surname, name, row });
          continue;
      }
      
      let courseId = courseBySku.get(sku);
      if (!courseId) {
          skipped.push({ reason: "No Course Found for SKU", sku, row });
          continue;
      }
      
      inserts.push([memberId, courseId, 'active']);
  }
  
  console.log(`Matched ${inserts.length} enrollments. Skipped ${skipped.length}.`);
  
  // Write skipped to log
  fs.writeFileSync('temp_import/skipped_enrollments.json', JSON.stringify(skipped, null, 2));

  console.log("Starting Transaction...");
  await connection.beginTransaction();
  try {
      console.log("Wiping enrollments table...");
      await connection.execute(`DELETE FROM enrollments`);
      // Optional: reset auto-increment if we care (not strictly necessary with DELETE, but clean)
      // await connection.execute(`ALTER TABLE enrollments AUTO_INCREMENT = 1`);
      
      console.log(`Inserting ${inserts.length} clean enrollments...`);
      // Batch insert in chunks of 1000
      const chunkSize = 1000;
      for (let i = 0; i < inserts.length; i += chunkSize) {
          const chunk = inserts.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => '(?, ?, ?)').join(',');
          const values = chunk.flat();
          await connection.query(`INSERT INTO enrollments (member_id, course_id, status) VALUES ${placeholders}`, values);
      }
      
      await connection.commit();
      console.log("Transaction Committed! Wipe & Reload successful.");
  } catch (err) {
      await connection.rollback();
      console.error("Transaction failed, rolled back:", err);
  } finally {
      await connection.end();
  }
}

main().catch(console.error);
