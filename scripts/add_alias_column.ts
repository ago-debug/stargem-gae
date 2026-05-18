import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const colsToText = [
      "social_facebook",
      "social_instagram",
      "social_tiktok",
      "social_youtube",
      "website",
      "education_title",
      "education_institute",
      "emergency_contact1_name",
      "emergency_contact1_email",
      "emergency_contact2_name"
    ];
    
    for (const col of colsToText) {
      try {
        await db.execute(sql.raw(`ALTER TABLE members MODIFY COLUMN ${col} TEXT NULL;`));
        console.log(`- ${col} convertita in TEXT per liberare spazio row-size`);
      } catch (e: any) {
        console.log(`- Impossibile convertire ${col}: ${e.message}`);
      }
    }
    
    const remaining = [
      "emergency_contact2_email",
      "emergency_contact3_name",
      "emergency_contact3_phone",
      "emergency_contact3_email"
    ];
    
    for (const col of remaining) {
       console.log(`Aggiungo ${col} come TEXT...`);
       try {
         await db.execute(sql.raw(`ALTER TABLE members ADD COLUMN ${col} TEXT NULL;`));
       } catch (e: any) {
         if (!e.message.includes("Duplicate column name")) {
             console.error(`Errore su ${col}:`, e);
         }
       }
    }
    
    console.log("Fine fix DB!");
  } catch (error: any) {
    console.error("Errore generico:", error);
  }
  process.exit(0);
}

run();
