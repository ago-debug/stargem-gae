import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== STEP D-BIS: Verifica Colonne members ===");
    const resCol = await db.execute(sql`
      SHOW COLUMNS FROM members 
      WHERE Field IN ('phone','profileImageUrl','profile_image_url','photo_url','email', 'profile_image');
    `);
    console.log(resCol[0]);

    console.log("\n=== STEP D-BIS: Tabella di comparazione Users vs Members ===");
    const resSync = await db.execute(sql`
      SELECT 
        u.username,
        u.first_name   AS u_nome,
        u.last_name    AS u_cognome,
        u.email        AS u_email,
        u.phone        AS u_phone,
        u.profile_image_url AS u_foto,
        m.first_name   AS m_nome,
        m.last_name    AS m_cognome,
        m.email        AS m_email,
        m.phone        AS m_phone,
        m.photo_url    AS m_foto
      FROM users u
      LEFT JOIN members m ON (
        (u.first_name = m.first_name AND u.last_name = m.last_name)
      )
      WHERE u.username IN (
        'Alexandra','Giuditta','Estefany','Nura','Joel',
        'Kevin','Jasir','Sara','Massi','Stefano',
        'Santo','Elisa','Gaetano'
      );
    `);
    console.log(resSync[0]);

  } catch (err) {
    console.error("Error executing query:", err);
  }
  process.exit(0);
}

run();
