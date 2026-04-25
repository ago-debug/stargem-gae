const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'gaetano_admin',
    password: 'Verona2026stargem2026',
    database: 'stargem_v2'
  });

  const [rows] = await connection.execute('SELECT * FROM members');

  const upperFields = ['last_name', 'first_name', 'fiscal_code', 'city', 'province', 'region', 'nationality', 'place_of_birth', 'albo_number', 'car_plate'];
  const lowerFields = ['email', 'secondary_email', 'email_pec', 'social_facebook', 'website'];
  const titleFields = ['address', 'street_address', 'profession', 'education_institute', 'education_title', 'bank_name', 'tutor1_last_name', 'tutor1_first_name', 'tutor2_last_name', 'tutor2_first_name', 'emergency_contact1_name', 'emergency_contact2_name'];

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
          last_name = ?, first_name = ?, fiscal_code = ?, city = ?, province = ?, region = ?, nationality = ?, place_of_birth = ?, albo_number = ?, car_plate = ?,
          email = ?, secondary_email = ?, email_pec = ?, social_facebook = ?, website = ?,
          address = ?, street_address = ?, profession = ?, education_title = ?, bank_name = ?, tutor1_last_name = ?, tutor1_first_name = ?, tutor2_last_name = ?, tutor2_first_name = ?, emergency_contact1_name = ?, emergency_contact2_name = ?
          WHERE id = ?`;
          
        const params = [
          row.last_name, row.first_name, row.fiscal_code, row.city, row.province, row.region, row.nationality, row.place_of_birth, row.albo_number, row.car_plate,
          row.email, row.secondary_email, row.email_pec, row.social_facebook, row.website,
          row.address, row.street_address, row.profession, row.education_title, row.bank_name, row.tutor1_last_name, row.tutor1_first_name, row.tutor2_last_name, row.tutor2_first_name, row.emergency_contact1_name, row.emergency_contact2_name,
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
