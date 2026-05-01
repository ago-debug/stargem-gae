import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== STEP A: Query di identificazione precisa (members) ===");
    const resA = await db.execute(sql`
      SELECT id, first_name, last_name, email, participant_type, user_id
      FROM members
      WHERE 
        (first_name='ALEXANDRA' AND last_name='MALDONADO') OR
        (first_name='GIUDITTA'  AND last_name='FUMAGALLI') OR
        (first_name='ESTEFANY'  AND last_name='SEGURA')    OR
        (first_name='NURA'      AND last_name='HANI')      OR
        (first_name='JOEL'      AND last_name='VILLON')    OR
        (first_name='KEVIN'     AND last_name='BONILLA')   OR
        (first_name='JASIR'     AND last_name='BLANCO')    OR
        (first_name='DIEGO'     AND last_name='CANDELARIO') OR
        (first_name='SARA'      AND last_name='JANNELLI')  OR
        (first_name='SANTO'     AND last_name='MANTICE')   OR
        (first_name='MASSIMILIANO' AND last_name='NEMBRI') OR
        (first_name='ELISA'     AND last_name='ARRIVABENE') OR
        (first_name='GAETANO'   AND last_name='AMBROSIO')  OR
        (first_name='STEFANO'   AND last_name='SARACCHI');
    `);
    console.log(resA[0]);
  } catch (err) {
    console.error("Error executing query:", err);
  }
  process.exit(0);
}

run();
