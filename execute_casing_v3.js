const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  const [rows] = await connection.execute('SELECT * FROM members');

  const upperFields = ['last_name', 'first_name', 'fiscal_code', 'city', 'province', 'region', 'nationality', 'place_of_birth', 'albo_numero', 'car_plate'];
  const lowerFields = ['email', 'secondary_email', 'email_pec', 'social_facebook', 'website'];
  const titleFields = ['address', 'street_address', 'profession', 'education_institute', 'education_title', 'bank_name', 'emergency_contact1_name', 'emergency_contact2_name', 'mother_first_name', 'mother_last_name', 'father_first_name', 'father_last_name'];

  function toTitleCase(str) {
    if (!str) return str;
    let titleStr = str.toLowerCase().split(' ').map(word => {
      let parts = word.split("'");
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("'");
    }).join(' ');
    
    titleStr = titleStr.replace(/([0-9\/])([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    return titleStr;
  }

  let changedCount = 0;

  try {
    await connection.beginTransaction();
    console.log('Transazione avviata. Inizio aggiornamento record...');

    for (const row of rows) {
      let changed = false;

      for (const field of upperFields) {
        if (row[field] && typeof row[field] === 'string') {
          const newVal = row[field].trim().toUpperCase();
          if (newVal !== row[field]) {
            row[field] = newVal;
            changed = true;
          }
        }
      }

      for (const field of lowerFields) {
        if (row[field] && typeof row[field] === 'string') {
          const newVal = row[field].trim().toLowerCase();
          if (newVal !== row[field]) {
            row[field] = newVal;
            changed = true;
          }
        }
      }

      for (const field of titleFields) {
        if (row[field] && typeof row[field] === 'string') {
          const newVal = toTitleCase(row[field].trim());
          if (newVal !== row[field]) {
            row[field] = newVal;
            changed = true;
          }
        }
      }

      if (changed) {
        const updateQuery = `UPDATE members SET 
          last_name = ?, first_name = ?, fiscal_code = ?, city = ?, province = ?, region = ?, nationality = ?, place_of_birth = ?, albo_numero = ?, car_plate = ?,
          email = ?, secondary_email = ?, email_pec = ?, social_facebook = ?, website = ?,
          address = ?, street_address = ?, profession = ?, education_institute = ?, education_title = ?, bank_name = ?, emergency_contact1_name = ?, emergency_contact2_name = ?, mother_first_name = ?, mother_last_name = ?, father_first_name = ?, father_last_name = ?
          WHERE id = ?`;
          
        const safeVal = (v) => v === undefined ? null : v;
        const params = [
          safeVal(row.last_name), safeVal(row.first_name), safeVal(row.fiscal_code), safeVal(row.city), safeVal(row.province), safeVal(row.region), safeVal(row.nationality), safeVal(row.place_of_birth), safeVal(row.albo_numero), safeVal(row.car_plate),
          safeVal(row.email), safeVal(row.secondary_email), safeVal(row.email_pec), safeVal(row.social_facebook), safeVal(row.website),
          safeVal(row.address), safeVal(row.street_address), safeVal(row.profession), safeVal(row.education_institute), safeVal(row.education_title), safeVal(row.bank_name), safeVal(row.emergency_contact1_name), safeVal(row.emergency_contact2_name), safeVal(row.mother_first_name), safeVal(row.mother_last_name), safeVal(row.father_first_name), safeVal(row.father_last_name),
          row.id
        ];
        
        await connection.execute(updateQuery, params);
        changedCount++;
      }
    }

    await connection.commit();
    console.log(`Transazione completata con successo! Aggiornati ${changedCount} record.`);

  } catch (error) {
    await connection.rollback();
    console.error('Errore durante l\'aggiornamento, ESEGUITO ROLLBACK!', error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
