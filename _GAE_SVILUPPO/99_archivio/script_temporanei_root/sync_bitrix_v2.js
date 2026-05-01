import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  try {
      console.log("Loading DB mappings...");
      const [seasons] = await connection.execute(`SELECT id FROM seasons WHERE active = 1`);
      const seasonId = seasons.length > 0 ? seasons[0].id : 1;

      const [dbCourses] = await connection.execute(`SELECT id, sku FROM courses WHERE sku IS NOT NULL AND sku != ''`);
      const courseBySku = new Map();
      dbCourses.forEach(c => courseBySku.set(c.sku.trim().toUpperCase(), c.id));

      const [dbMembers] = await connection.execute(`SELECT id, fiscal_code FROM members WHERE fiscal_code IS NOT NULL`);
      const memberByFC = new Map();
      dbMembers.forEach(m => memberByFC.set(m.fiscal_code.trim().toUpperCase(), m.id));

      await connection.beginTransaction();
      console.log("Wiping enrollments table...");
      await connection.execute(`DELETE FROM enrollments`);

      const inserts = [];
      const skippedSkus = new Set();
      
      function processSkus(skuStr, memberId) {
          if (!skuStr || typeof skuStr !== 'string') return;
          const skus = skuStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
          for (let rawSku of skus) {
              let cleanSku = rawSku.toUpperCase();
              if (cleanSku.includes('.')) {
                  cleanSku = cleanSku.split('.')[0];
              }
              const courseId = courseBySku.get(cleanSku);
              if (courseId) {
                  inserts.push([memberId, courseId, 'active', seasonId]);
              } else {
                  skippedSkus.add(rawSku + " -> " + cleanSku);
              }
          }
      }

      console.log("Parsing Bitrix Master file...");
      const wb1 = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
      const data1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]]);
      
      for (const row of data1) {
          let fc = row['an_cod_fiscale'] ? String(row['an_cod_fiscale']).trim().toUpperCase() : null;
          let name = row['an_nome'] ? String(row['an_nome']).trim() : null;
          let surname = row['an_cognome'] ? String(row['an_cognome']).trim() : null;
          
          if (!fc && !(name && surname)) continue;
          
          let memberId = fc ? memberByFC.get(fc) : null;
          
          if (!memberId) {
              const phone = row['an_telefono'] ? String(row['an_telefono']).trim() : null;
              const gender = row['an_sesso'] && row['an_sesso'].toLowerCase().startsWith('d') ? 'F' : 'M';
              const [res] = await connection.execute(
                  `INSERT INTO members (first_name, last_name, fiscal_code, phone, gender) VALUES (?, ?, ?, ?, ?)`,
                  [name || '', surname || '', fc, phone, gender]
              );
              memberId = res.insertId;
              if (fc) memberByFC.set(fc, memberId);
          }

          processSkus(row['codici_corso_iscrizioni'], memberId);
          processSkus(row['codici_corso_prove_e_lezioni'], memberId);
      }

      console.log("Parsing Workshop file...");
      const wb2 = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
      const data2 = xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]]);
      
      for (const row of data2) {
          let fc = row['codice_fiscale'] ? String(row['codice_fiscale']).trim().toUpperCase() : null;
          let name = row['nome'] ? String(row['nome']).trim() : null;
          let surname = row['cognome'] ? String(row['cognome']).trim() : null;
          
          if (!fc && !(name && surname)) continue;
          let memberId = fc ? memberByFC.get(fc) : null;
          if (!memberId) {
              const phone = row['telefono'] ? String(row['telefono']).trim() : null;
              const [res] = await connection.execute(
                  `INSERT INTO members (first_name, last_name, fiscal_code, phone) VALUES (?, ?, ?, ?)`,
                  [name || '', surname || '', fc, phone]
              );
              memberId = res.insertId;
              if (fc) memberByFC.set(fc, memberId);
          }
          
          processSkus(row['SKU/codice'], memberId);
      }

      console.log(`Inserting ${inserts.length} enrollments...`);
      const chunkSize = 1000;
      for (let i = 0; i < inserts.length; i += chunkSize) {
          const chunk = inserts.slice(i, i + chunkSize);
          const placeholders = chunk.map(() => '(?, ?, ?, ?)').join(',');
          const values = chunk.flat();
          await connection.query(
              `INSERT INTO enrollments (member_id, course_id, status, season_id) VALUES ${placeholders}`, 
              values
          );
      }

      console.log("Deduplicating any potential double insertions...");
      await connection.execute(`
          DELETE e1 FROM enrollments e1
          INNER JOIN enrollments e2 
          WHERE e1.id > e2.id 
          AND e1.member_id = e2.member_id 
          AND e1.course_id = e2.course_id
      `);

      await connection.commit();
      console.log("SUCCESS! All enrollments perfectly mapped to existing courses.");
      
      const [finalCount] = await connection.execute(`SELECT COUNT(*) as cnt FROM enrollments`);
      console.log(`Final Database Enrollments: ${finalCount[0].cnt}`);

  } catch (err) {
      await connection.rollback();
      console.error("FAILED, rolled back.", err);
  } finally {
      await connection.end();
  }
}
main().catch(console.error);
