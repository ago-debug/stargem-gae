import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  const ts = new Date().toISOString().replace(/[:\-T]/g, '_').slice(0, 15);
  
  console.log("--- BACKUP PRELIMINARE ---");
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS courses_backup_op7_final_${ts} 
    AS SELECT * FROM courses WHERE activity_type = 'storico'
  `));
  console.log(`Backup locale creato: courses_backup_op7_final_${ts}`);

  console.log("\nINIZIO TRANSAZIONE...");
  
  try {
    await db.transaction(async (tx) => {
      
      const res1 = await tx.execute(sql`
        UPDATE courses SET activity_type = 'domenica_movimento'
        WHERE activity_type = 'storico'
        AND (sku LIKE '%KUQI%'
          OR sku LIKE '%RUSSO19OTT%'
          OR sku LIKE '%DOSSANTO%');
      `);
      console.log(`UPDATE 1 (Domeniche in Movimento): Aggiornati ${res1[0].affectedRows} corsi.`);

      const res2 = await tx.execute(sql`
        UPDATE courses SET activity_type = 'workshop'
        WHERE activity_type = 'storico'
        AND sku IN (
          '2526ANDRIANO19APR',
          '2526BELLAYGIO20',
          '2526GARIANOGIO18',
          '2526BONNILUN21',
          '2526GALLUZZOMAR17',
          '2526CARIZZONILUN18'
        );
      `);
      console.log(`UPDATE 2 (Workshop residui): Aggiornati ${res2[0].affectedRows} corsi.`);

      const res3 = await tx.execute(sql`
        UPDATE courses SET activity_type = 'prova_gratuita'
        WHERE activity_type = 'storico'
        AND sku = '2526LEZPROVA';
      `);
      console.log(`UPDATE 3 (Prova): Aggiornati ${res3[0].affectedRows} corsi.`);

      const res4 = await tx.execute(sql`
        UPDATE courses SET activity_type = 'corso'
        WHERE activity_type = 'storico'
        AND sku IN (
          '2526GRANDESAB09',
          '2526SANTOROMAR18',
          '2526POZZOLIMER19',
          '2526GEDDOVEN20'
        );
      `);
      console.log(`UPDATE 4 (Corsi storici): Aggiornati ${res4[0].affectedRows} corsi.`);

      const res5 = await tx.execute(sql`
        UPDATE courses SET activity_type = 'merchandising'
        WHERE activity_type = 'storico'
        AND sku = '2526MERCHANDISING';
      `);
      console.log(`UPDATE 5 (Merchandising): Aggiornati ${res5[0].affectedRows} corsi.`);

    });
    console.log("TRANSAZIONE COMPLETATA CON SUCCESSO.");

  } catch (err) {
    console.error("ERRORE DURANTE LA TRANSAZIONE:", err);
    process.exit(1);
  }

  const finalCheck = await db.execute(sql`
    SELECT activity_type, COUNT(*) as tot
    FROM courses
    WHERE sku LIKE '2526%'
    GROUP BY activity_type
    ORDER BY tot DESC;
  `);
  console.log("\n--- Verifica finale dopo la transazione ---");
  console.table(finalCheck[0] || finalCheck);

  const checkStorico = await db.execute(sql`
    SELECT id, sku, name
    FROM courses
    WHERE activity_type = 'storico'
    AND sku LIKE '2526%';
  `);
  console.log("\n--- Verifica 'storico' rimanenti ---");
  console.table(checkStorico[0] || checkStorico);

  process.exit(0);
}
run().catch(console.error);
