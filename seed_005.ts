import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== STEP 1: PROMO RULES ===");

  console.log("Inserting Public Promo Rules...");
  await db.execute(sql`
    INSERT IGNORE INTO promo_rules
      (tenant_id,code,label,rule_type,value,
       target_type,exclude_open,not_cumulative,
       valid_from,valid_to)
    VALUES
    (1,'2526PRIMAVERA','Promo Primavera',
     'percentage',0,'public',false,true,
     '2025-05-20','2025-06-14'),
    (1,'2526ESTATE','Promo Estate',
     'percentage',0,'public',false,true,
     '2025-06-15','2025-07-15'),
    (1,'2526AUTUNNO-ISCR','Promo Autunno con Tessera',
     'percentage',0,'public',false,true,
     '2025-09-01','2025-10-31'),
    (1,'2526AUTUNNO-NO-ISCR','Promo Autunno senza Tessera',
     'percentage',0,'public',false,true,
     '2025-09-01','2025-10-31'),
    (1,'2526HALLOWEEN-ISCR','Halloween con Tessera',
     'percentage',0,'public',false,true,
     '2025-10-15','2025-11-05'),
    (1,'2526HALLOWEEN-NO-ISCR','Halloween senza Tessera',
     'percentage',0,'public',false,true,
     '2025-10-15','2025-11-05'),
    (1,'2526BLACKFRIDAY-ISCR','Black Friday con Tessera',
     'percentage',0,'public',false,true,
     '2025-11-20','2025-11-30'),
    (1,'2526BLACKFRIDAY-NO-ISCR','Black Friday senza Tessera',
     'percentage',0,'public',false,true,
     '2025-11-20','2025-11-30'),
    (1,'2526NEWYEAR-ISCR','Nuovo Anno con Tessera',
     'percentage',0,'public',false,true,
     '2025-12-26','2026-01-10'),
    (1,'2526NEWYEAR-NO-ISCR','Nuovo Anno senza Tessera',
     'percentage',0,'public',false,true,
     '2025-12-26','2026-01-10'),
    (1,'2526SPRING-ISCR','Primavera con Tessera',
     'percentage',0,'public',false,true,
     '2026-03-01','2026-04-30'),
    (1,'2526SPRING-NO-ISCR','Primavera senza Tessera',
     'percentage',0,'public',false,true,
     '2026-03-01','2026-04-30');
  `);

  console.log("Inserting Company Promo Rules...");
  await db.execute(sql`
    INSERT IGNORE INTO promo_rules
      (tenant_id,code,label,rule_type,value,
       target_type,exclude_open,not_cumulative,
       company_name)
    VALUES
    (1,'2526BOCCONI20','Convenzione Bocconi',
     'percentage',20,'company',true,true,
     'Università Bocconi'),
    (1,'2526BICOCCA20','Convenzione Bicocca',
     'percentage',20,'company',true,true,
     'Università Bicocca'),
    (1,'2526FORZEORDINE20','Forze dell Ordine',
     'percentage',20,'company',true,true,
     'Polizia/Carabinieri/Finanza'),
    (1,'2526AVVALE20','Convenzione Avvale',
     'percentage',20,'company',true,true,
     'Avvale Spa (ex Techedge)'),
    (1,'2526CREDITAGRICOL20','Convenzione Credit Agricole',
     'percentage',20,'company',true,true,
     'Credit Agricole'),
    (1,'2526AVV4PIANO30','Avvocati 4° Piano',
     'percentage',30,'company',true,true,
     'Avvocati e dipendenti 4° piano'),
    (1,'2526DIREZIONE20','Direzione -20%',
     'percentage',20,'company',true,true,
     'Direzione interna'),
    (1,'2526DIREZIONE30','Direzione -30%',
     'percentage',30,'company',true,true,
     'Direzione interna'),
    (1,'2526DIREZIONE50','Direzione -50%',
     'percentage',50,'company',true,true,
     'Direzione interna'),
    (1,'2526WS.ST4FF20','Staff Workshop -20%',
     'percentage',20,'staff',false,true,
     NULL);
  `);

  console.log("Inserting Personal/Staff/Welfare Promo Rules...");
  await db.execute(sql`
    INSERT IGNORE INTO promo_rules
      (tenant_id,code,label,rule_type,value,
       target_type,exclude_open,not_cumulative)
    VALUES
    (1,'2526ELISA20','Elisa -20%',
     'percentage',20,'personal',false,true),
    (1,'2526ELISA30','Elisa -30%',
     'percentage',30,'personal',false,true),
    (1,'2526ELISA40','Elisa -40%',
     'percentage',40,'personal',false,true),
    (1,'2526ELISA50','Elisa -50%',
     'percentage',50,'personal',false,true),
    (1,'2526ELISA55','Elisa -55%',
     'percentage',55,'personal',false,true),
    (1,'2526ELISA70','Elisa -70%',
     'percentage',70,'personal',false,true),
    (1,'2526ELISA80','Elisa -80%',
     'percentage',80,'personal',false,true),
    (1,'2526ELISA100','Elisa -100% (Gratuito)',
     'percentage',100,'personal',false,true),
    (1,'2526GAE07','Gaetano -7%',
     'percentage',7,'personal',false,true),
    (1,'2526GAE10','Gaetano -10%',
     'percentage',10,'personal',false,true),
    (1,'2526GAE20','Gaetano -20%',
     'percentage',20,'personal',false,true),
    (1,'2526GAE30','Gaetano -30%',
     'percentage',30,'personal',false,true),
    (1,'2526ESTEFANY05','Estefany -5%',
     'percentage',5,'personal',false,true),
    (1,'2526ESTEFANY10','Estefany -10%',
     'percentage',10,'personal',false,true),
    (1,'2526ALEXANDRA05','Alexandra -5%',
     'percentage',5,'personal',false,true),
    (1,'2526ALEXANDRA10','Alexandra -10%',
     'percentage',10,'personal',false,true),
    (1,'2526STAFF60','Staff -60%',
     'percentage',60,'staff',false,true),
    (1,'2526STAFF70','Staff -70%',
     'percentage',70,'staff',false,true),
    (1,'2526VIDEO30','Video Home Page -30%',
     'percentage',30,'personal',false,true),
    (1,'2526VIDEO50','Video Home Page -50%',
     'percentage',50,'personal',false,true),
    (1,'2526VIDEO100','Video Home Page -100%',
     'percentage',100,'personal',false,true),
    (1,'2526MASSI10','Massi -10%',
     'percentage',10,'personal',false,true),
    (1,'2526VIP75','VIP -75%',
     'percentage',75,'personal',false,true),
    (1,'2526DOPOPROVA05','Dopo Prova -5%',
     'percentage',5,'public',false,true),
    (1,'2526GIUDITTA10','Giuditta -10%',
     'percentage',10,'personal',false,true),
    (1,'2526DIREZIONE20.PERS','Direzione -20%',
     'percentage',20,'personal',false,true),
    (1,'2425OPENPAGATO100','Open già Pagato',
     'percentage',100,'personal',true,true),
    (1,'2526MODULOLUN09.Y','Modulo Academy Lun 9',
     'percentage',0,'welfare',false,true);
  `);
  console.log("Promo rules inserted.");

  console.log("\n=== STEP 2: INSTRUCTOR AGREEMENTS ===");
  const [membersRes] = await db.execute(sql`
    SELECT id, last_name, first_name 
    FROM members 
    WHERE participant_type = 'INSEGNANTE'
    AND last_name IN ('Seabra','Filly','Gariano','Salsavilca','Avila','Albano','Carbone','Cugge')
  `);
  console.log("Found members:");
  console.log(JSON.stringify(membersRes, null, 2));

  const [studiosRes] = await db.execute(sql`
    SELECT id, name FROM studios 
    WHERE name IN ('Studio 4','Studio 5','Studio 22','Studio 25','Studio 04','Studio 05')
  `);
  console.log("Found studios:");
  console.log(JSON.stringify(studiosRes, null, 2));

  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
