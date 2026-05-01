import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== STEP A-BIS: Ricerca Diretta (Nomi/Cognomi + ID noti) ===");
    const resA = await db.execute(sql`
      SELECT id, first_name, last_name, email, phone, photo_url, participant_type, user_id
      FROM members
      WHERE id IN (9325, 4687, 3419)
      UNION
      SELECT id, first_name, last_name, email, phone, photo_url, participant_type, user_id
      FROM members
      WHERE LOWER(first_name) IN (
        'alexandra','giuditta','estefany','nura','jasir','diego','sara','elisa','gaetano','massimiliano','stefano'
      )
      AND LOWER(last_name) IN (
        'maldonado','fumagalli','segura','hani','blanco','candelario','jannelli','arrivabene','ambrosio','nembri','saracchi'
      )
      ORDER BY first_name;
    `);
    console.log(resA[0]);

    console.log("\n=== STEP A-BIS: Ricerca per Email Aziendale ===");
    const resB = await db.execute(sql`
      SELECT id, first_name, last_name, email, participant_type, user_id
      FROM members
      WHERE email LIKE '%studio-gem.it%'
        OR email IN (
          'elisa@studio-gem.it',
          'gaetano@studio-gem.it',
          'massimiliano@studio-gem.it',
          'sara@studio-gem.it'
        );
    `);
    console.log(resB[0]);

  } catch (err) {
    console.error("Error executing queries:", err);
  }
  process.exit(0);
}

run();
