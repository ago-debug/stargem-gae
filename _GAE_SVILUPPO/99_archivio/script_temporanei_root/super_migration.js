import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

function parseAmt(val) {
    if (!val) return 0;
    const s = String(val).replace('€', '').replace(/\s/g, '').replace(',', '.');
    const f = parseFloat(s);
    return isNaN(f) ? 0 : f;
}

function parseDate(val) {
    if (!val) return new Date('2026-01-01');
    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569)*86400*1000));
        return isNaN(d.getTime()) ? new Date('2026-01-01') : d;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return new Date('2026-01-01');
}

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  try {
      console.log("Loading DB mappings...");
      const [seasons] = await connection.execute(`SELECT id FROM seasons WHERE active = 1`);
      const seasonId = seasons.length > 0 ? seasons[0].id : 1;

      const [dbCourses] = await connection.execute(`SELECT id, sku, activity_type FROM courses WHERE sku IS NOT NULL AND sku != ''`);
      const courseBySku = new Map();
      dbCourses.forEach(c => courseBySku.set(c.sku.trim().toUpperCase(), c));

      const [dbMembers] = await connection.execute(`SELECT id, fiscal_code FROM members WHERE fiscal_code IS NOT NULL`);
      const memberByFC = new Map();
      dbMembers.forEach(m => memberByFC.set(m.fiscal_code.trim().toUpperCase(), m.id));

      await connection.beginTransaction();
      console.log("Wiping enrollments and payments tables...");
      await connection.execute(`DELETE FROM payments`);
      await connection.execute(`DELETE FROM enrollments`);
      
      await connection.execute(`ALTER TABLE payments AUTO_INCREMENT = 1`);
      await connection.execute(`ALTER TABLE enrollments AUTO_INCREMENT = 1`);

      const enrollmentsInsert = [];
      const paymentsInsert = [];
      const skippedSkus = new Set();
      
      function addEnrollment(skuStr, memberId, fallbackSeasonId = seasonId) {
          if (!skuStr || typeof skuStr !== 'string') return;
          const skus = skuStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
          for (let rawSku of skus) {
              let cleanSku = rawSku.toUpperCase();
              if (cleanSku.includes('.')) cleanSku = cleanSku.split('.')[0];
              
              const course = courseBySku.get(cleanSku);
              if (course) {
                  let sId = fallbackSeasonId;
                  if (cleanSku.startsWith('2425')) sId = 3;
                  else if (cleanSku.startsWith('2627')) sId = 2;
                  
                  enrollmentsInsert.push([memberId, course.id, 'active', sId]);
              } else {
                  skippedSkus.add(rawSku + " -> " + cleanSku);
              }
          }
      }

      function addPayment(memberId, amount, date, description, type, labels) {
          if (amount === 0) return;
          const status = 'paid';
          paymentsInsert.push([amount, date, status, type, memberId, description || '', JSON.stringify(labels)]);
      }

      console.log("Parsing Bitrix Master file...");
      const wb1 = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
      const data1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { defval: null });
      
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

          addEnrollment(row['codici_corso_iscrizioni'], memberId);
          addEnrollment(row['codici_corso_prove_e_lezioni'], memberId);

          const amt1 = parseAmt(row['sz1_totale_quota']);
          if (amt1 > 0) {
              const date = parseDate(row['sz1_data_pag__saldo_ann_']);
              const desc = row['sz1_descrizione_quota'] || 'SZ1';
              const labels = ['SZ1', row['sz1_codice_sconto']].filter(Boolean);
              addPayment(memberId, amt1, date, desc, 'course', labels);
          }

          const amt2 = parseAmt(row['sz2_totale_quota']);
          if (amt2 > 0) {
              const date = parseDate(row['sz2_data_pag_saldo_ann_'] || row['sz2_data_pag_lez_prova']);
              const desc = row['sz2_descrizione_quota'] || 'SZ2';
              const labels = ['SZ2', row['sz2_codice_sconto']].filter(Boolean);
              addPayment(memberId, amt2, date, desc, 'course', labels);
          }

          const amt3 = parseAmt(row['sz3_totale_quota']);
          if (amt3 > 0) {
              const date = parseDate(row['sz3_data_pag_saldo_ann_'] || row['sz3_data_pag_lez_prova']);
              const desc = row['sz3_descrizione_quota'] || 'SZ3';
              const labels = ['SZ3', row['sz3_codice_sconto']].filter(Boolean);
              addPayment(memberId, amt3, date, desc, 'course', labels);
          }

          const amt4 = parseAmt(row['sz4_totale_quota']);
          if (amt4 > 0) {
              const date = parseDate(row['sz4_data_pag_saldo_quad_']);
              const desc = row['sz4_descrizione_quota'] || 'SZ4';
              const labels = ['SZ4', row['sz4_codice_sconto']].filter(Boolean);
              addPayment(memberId, amt4, date, desc, 'course', labels);
          }

          const amtTessera = parseAmt(row['quota_tessera']);
          if (amtTessera > 0) {
              const date = parseDate(row['data_emissione pagamento_tessera']);
              addPayment(memberId, amtTessera, date, 'QUOTA TESSERA', 'membership', ['TESSERA', row['tessera_ente']]);
          }
      }

      console.log("Parsing Elenco Iscrizioni...");
      const wbA = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
      const dataA = xlsx.utils.sheet_to_json(wbA.Sheets[wbA.SheetNames[0]], { header: "A", defval: null });
      
      for (let i = 1; i < dataA.length; i++) {
          const row = dataA[i];
          let sku = row['AG'] ? String(row['AG']).trim().toUpperCase() : null;
          if (!sku) continue;
          
          let cleanSku = sku.includes('.') ? sku.split('.')[0] : sku;
          const course = courseBySku.get(cleanSku);
          
          if (course && course.activity_type !== 'course' && course.activity_type !== 'workshop') {
              let fc = row['F'] ? String(row['F']).trim().toUpperCase() : null;
              let memberId = fc ? memberByFC.get(fc) : null;
              
              if (!memberId) {
                  let name = row['E'] ? String(row['E']).trim() : '';
                  let surname = row['D'] ? String(row['D']).trim() : '';
                  const [res] = await connection.execute(
                      `INSERT INTO members (first_name, last_name, fiscal_code) VALUES (?, ?, ?)`,
                      [name, surname, fc]
                  );
                  memberId = res.insertId;
                  if (fc) memberByFC.set(fc, memberId);
              }
              
              addEnrollment(cleanSku, memberId);

              const eTot = parseAmt(row['AV']); // Totale Gen.
              if (eTot > 0) {
                  const date = parseDate(row['A']); // Data Iscri.
                  addPayment(memberId, eTot, date, `Quota ${course.activity_type}`, 'other', ['ELENCO', cleanSku]);
              }
          }
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
          
          addEnrollment(row['SKU/codice'], memberId);
      }

      console.log(`Inserting ${enrollmentsInsert.length} enrollments...`);
      let eChunkSize = 1000;
      for (let i = 0; i < enrollmentsInsert.length; i += eChunkSize) {
          const chunk = enrollmentsInsert.slice(i, i + eChunkSize);
          const placeholders = chunk.map(() => '(?, ?, ?, ?)').join(',');
          const values = chunk.flat();
          await connection.query(
              `INSERT INTO enrollments (member_id, course_id, status, season_id) VALUES ${placeholders}`, 
              values
          );
      }

      console.log("Deduplicating enrollments...");
      await connection.execute(`
          DELETE e1 FROM enrollments e1
          INNER JOIN enrollments e2 
          WHERE e1.id > e2.id 
          AND e1.member_id = e2.member_id 
          AND e1.course_id = e2.course_id
      `);

      console.log(`Inserting ${paymentsInsert.length} payments...`);
      let pChunkSize = 1000;
      for (let i = 0; i < paymentsInsert.length; i += pChunkSize) {
          const chunk = paymentsInsert.slice(i, i + pChunkSize);
          const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
          const values = chunk.flat();
          await connection.query(
              `INSERT INTO payments (amount, paid_date, status, type, member_id, description, payment_note_labels) VALUES ${placeholders}`, 
              values
          );
      }

      await connection.commit();
      console.log("SUCCESS! Super-Migration completed.");
      
      const [eCount] = await connection.execute(`SELECT COUNT(*) as cnt FROM enrollments`);
      const [pCount] = await connection.execute(`SELECT COUNT(*) as cnt, SUM(amount) as sum FROM payments`);
      console.log(`Final Enrollments: ${eCount[0].cnt}`);
      console.log(`Final Payments: ${pCount[0].cnt} (Total Amount: €${pCount[0].sum})`);

  } catch (err) {
      await connection.rollback();
      console.error("FAILED, rolled back.", err);
  } finally {
      await connection.end();
  }
}
main().catch(console.error);
