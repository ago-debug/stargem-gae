import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    // STEP B
    console.log("=== STEP B ===");
    const resB = await db.execute(sql`
      UPDATE users SET role = 'operator' 
      WHERE username IN (
        'Alexandra','Giuditta','Estefany','Nura','Joel',
        'Kevin','Jasir','Sara','Massi','Stefano'
      );
    `);
    console.log("Righe aggiornate STEP B:", resB[0].affectedRows);

    // STEP C
    console.log("\n=== STEP C ===");
    const resC1 = await db.execute(sql`
      INSERT INTO members 
        (first_name, last_name, email, phone, participant_type, created_at, updated_at)
      VALUES
        ('ALEXANDRA','MALDONADO','alexandra@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW()),
        ('GIUDITTA','FUMAGALLI','Giuditta@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW()),
        ('ESTEFANY','SEGURA','Estefany@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW()),
        ('NURA','HANI','nura@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW()),
        ('JASIR','BLANCO','jasir@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW()),
        ('SARA','JANNELLI','sara@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW()),
        ('DIEGO','CANDELARIO','diego@studio-gem.it', NULL, 'DIPENDENTE', NOW(), NOW());
    `);
    console.log("Nuovi members creati in STEP C:", resC1[0].affectedRows);
    
    const resC2 = await db.execute(sql`
      INSERT INTO users 
        (id, username, email, role, first_name, last_name, created_at, updated_at)
      VALUES 
        (UUID(),'Diego','diego@studio-gem.it','operator',
         'Diego','Candelario', NOW(), NOW());
    `);
    const diegoIdRes = await db.execute(sql`SELECT id FROM users WHERE username = 'Diego'`);
    console.log("Diego user creato con ID:", diegoIdRes[0][0].id);

    // STEP C-BIS
    console.log("\n=== STEP C-BIS ===");
    await db.execute(sql`UPDATE members SET participant_type = 'DIPENDENTE' WHERE id = 9122;`);
    
    const enrollments = await db.execute(sql`SELECT COUNT(*) as c FROM enrollments WHERE member_id = 9502;`);
    const memberships = await db.execute(sql`SELECT COUNT(*) as c FROM memberships WHERE member_id = 9502;`);
    const payments = await db.execute(sql`SELECT COUNT(*) as c FROM payments WHERE member_id = 9502;`);
    
    const count = Number(enrollments[0][0].c) + Number(memberships[0][0].c) + Number(payments[0][0].c);
    console.log(`FK counts per 9502: enrollments=${enrollments[0][0].c}, memberships=${memberships[0][0].c}, payments=${payments[0][0].c}`);
    if (count === 0) {
      const resDel = await db.execute(sql`DELETE FROM members WHERE id = 9502;`);
      console.log("Duplicato 9502 eliminato. Righe:", resDel[0].affectedRows);
    } else {
      console.log("ATTENZIONE: 9502 ha FK attive, non eliminato.");
    }

    // STEP D
    console.log("\n=== STEP D ===");
    const ids = [2488, 2490, 9325, 4687, 3419, 847, 9122];
    const usernames = ['Elisa', 'Gaetano', 'Joel', 'Kevin', 'Santo', 'Massi', 'Stefano'];
    for(let i=0; i<ids.length; i++){
      const res = await db.execute(sql`
        UPDATE members SET 
          participant_type = 'DIPENDENTE',
          user_id = (SELECT id FROM users WHERE username = ${usernames[i]})
        WHERE id = ${ids[i]};
      `);
      console.log(`Upd user_id for known member ${usernames[i]} (id ${ids[i]}):`, res[0].affectedRows);
    }

    const newNames = [
      {u: 'Alexandra', f: 'ALEXANDRA', l: 'MALDONADO'},
      {u: 'Giuditta', f: 'GIUDITTA', l: 'FUMAGALLI'},
      {u: 'Estefany', f: 'ESTEFANY', l: 'SEGURA'},
      {u: 'Nura', f: 'NURA', l: 'HANI'},
      {u: 'Jasir', f: 'JASIR', l: 'BLANCO'},
      {u: 'Sara', f: 'SARA', l: 'JANNELLI'},
      {u: 'Diego', f: 'DIEGO', l: 'CANDELARIO'}
    ];
    for (const n of newNames) {
      const res = await db.execute(sql`
        UPDATE members SET 
          user_id = (SELECT id FROM users WHERE username = ${n.u})
        WHERE first_name = ${n.f} AND last_name = ${n.l};
      `);
      console.log(`Upd user_id for new member ${n.f}:`, res[0].affectedRows);
    }

    // STEP D-BIS
    console.log("\n=== STEP D-BIS ===");
    const allSync = [...newNames];
    allSync.push({u: 'Joel', f: 'JOEL', l: 'VILLON'});
    allSync.push({u: 'Kevin', f: 'KEVIN', l: 'BONILLA'});
    allSync.push({u: 'Santo', f: 'SANTO', l: 'MANTICE'});
    allSync.push({u: 'Massi', f: 'MASSIMILIANO VALENTINO', l: 'NEMBRI'});
    allSync.push({u: 'Stefano', f: 'STEFANO', l: 'SARACCHI'});
    allSync.push({u: 'Elisa', f: 'ELISA', l: 'ARRIVABENE'});
    allSync.push({u: 'Gaetano', f: 'GAETANO', l: 'AMBROSIO'});

    for (const s of allSync) {
      const res = await db.execute(sql`
        UPDATE members m
        JOIN users u ON u.username = ${s.u}
        SET
          m.email     = COALESCE(NULLIF(m.email,''), u.email),
          m.phone     = COALESCE(NULLIF(m.phone,''), u.phone),
          m.photo_url = COALESCE(NULLIF(m.photo_url,''), u.profile_image_url)
        WHERE m.first_name = ${s.f} AND m.last_name = ${s.l};
      `);
      console.log(`Sync D-BIS per ${s.u}: affected rows ${res[0].affectedRows}`);
    }

  } catch(e) {
    console.error("ERRORE FATALE:", e);
  }
  process.exit(0);
}

run();
