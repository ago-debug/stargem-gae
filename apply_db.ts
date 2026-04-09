import mysql from "mysql2/promise";
import fs from "fs";

async function main() {
  const connection = await mysql.createConnection("mysql://gaetano_admin:StarGem2026!Secure@127.0.0.1:3307/stargem_v2");
  
  // 1. Applica 0012 se esiste
  const sql12 = fs.readFileSync("migrations/0012_quote_promo_module.sql", "utf-8");
  const stmts12 = sql12.split("--> statement-breakpoint");
  for (let stmt of stmts12) {
    stmt = stmt.trim();
    if (!stmt) continue;
    try {
      await connection.query(stmt);
      console.log("[OK] Executed from 0012");
    } catch (e: any) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME') {
        console.log(`[SKIP] Already exists from 0012`);
      } else {
        console.log(`[ERR 0012] ${e.message}`);
      }
    }
  }

  // 2. Applica 0013
  const sql13 = fs.readFileSync("migrations/0013_quote_promo_contabilita.sql", "utf-8");
  const stmts13 = sql13.split("--> statement-breakpoint");
  for (let stmt of stmts13) {
    stmt = stmt.trim();
    if (!stmt) continue;
    try {
      await connection.query(stmt);
      console.log("[OK] Executed from 0013");
    } catch (e: any) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME') {
        console.log(`[SKIP] Already exists from 0013`);
      } else {
        console.log(`[ERR 0013] ${e.message}`);
      }
    }
  }

  // 3. Seeding (custom_lists)
  const [rows] = await connection.query(`SELECT id FROM custom_lists WHERE system_name = 'wallet_types'`);
  if ((rows as any[]).length === 0) {
    const [result] = await connection.query(`
      INSERT INTO custom_lists (system_name, label, description, is_active)
      VALUES ('wallet_types', 'Tipi Carnet', 'Tipologie pacchetti/carnet disponibili', true)
    `);
    const wid = (result as any).insertId;
    
    await connection.query(`
      INSERT INTO custom_list_items (list_id, value, label, sort_order, is_active, color)
      VALUES
      (?, 'lezioni_singole', 'Lezioni Singole', 1, true, '#378ADD'),
      (?, 'lezioni_coppia', 'Lezioni Coppia', 2, true, '#1D9E75'),
      (?, 'lezioni_aerea', 'Lezioni Aeree', 3, true, '#7F77DD'),
      (?, 'ore_affitto', 'Ore Affitto Sala', 4, true, '#BA7517'),
      (?, 'ore_affitto_aerea', 'Ore Affitto Aerea', 5, true, '#D4537E')
    `, [wid, wid, wid, wid, wid]);
    console.log("[OK] Seeded custom_lists wallet_types");
  } else {
    console.log("[SKIP] custom_lists wallet_types already exists");
  }

  // 4. Seeding welfare_providers
  const [wp] = await connection.query(`SELECT COUNT(*) as c FROM welfare_providers`);
  if ((wp as any)[0].c === 0) {
    await connection.query(`
      INSERT INTO welfare_providers
        (tenant_id,name,requires_membership_fee,requires_medical_cert,extra_fee_percent,available_categories,operative_notes)
      VALUES
      (1,'Fitprime',true,true,0,'Danza,Fitness','BASE=4ing/50€ MEDIUM=8ing/100€ LARGE=1al giorno/mese=150€. Check-in obbligatorio.'),
      (1,'Wellhub',false,true,0,'Danza,Fitness','Max 8 ingressi/mese. Tessera SENZA pagamento quota 25€.'),
      (1,'Pellegrini',true,true,3,'Danza,Ballo,Fitness,Aerial','Verificare voucher su info@studio-gem.it. +3% sul prezzo corso.'),
      (1,'Wai',true,true,7,'Danza,Ballo,Fitness,Aerial','Verificare voucher su info@studio-gem.it. +7% sul prezzo corso.')
    `);
    console.log("[OK] Seeded welfare_providers");
  }

  // 5. Seeding pagodil_tiers
  const [pt] = await connection.query(`SELECT COUNT(*) as c FROM pagodil_tiers`);
  if ((pt as any)[0].c === 0) {
    await connection.query(`
      INSERT INTO pagodil_tiers
        (tenant_id,provider_name,range_min,range_max,fee_amount,fee_type,installments_max)
      VALUES
      (1,'pagodil',0,350,25,'fixed',6),
      (1,'pagodil',350,1000,50,'fixed',6),
      (1,'pagodil',1000,1500,100,'fixed',6)
    `);
    console.log("[OK] Seeded pagodil_tiers");
  }

  // 6. Seeding cost_centers
  const [cc] = await connection.query(`SELECT COUNT(*) as c FROM cost_centers`);
  if ((cc as any)[0].c === 0) {
    await connection.query(`
      INSERT INTO cost_centers
        (tenant_id,code,label,description)
      VALUES
      (1,'CORSI','Corsi di Gruppo','Ricavi da iscrizioni corsi annuali e abbonamenti'),
      (1,'AFFITTI','Affitti Sale','Ricavi da affitto sale orario e pacchetti'),
      (1,'PRIVATI','Lezioni Private','Ricavi da lezioni individuali, coppia e carnet'),
      (1,'TESSERE','Tessere e Assicurazioni','Ricavi da quota tessera annuale 25€'),
      (1,'ACCORDI','Accordi Maestri','Entrate/uscite da accordi continuativi maestri'),
      (1,'WELFARE','Welfare Aziendale','Ricavi da piattaforme welfare Fitprime/Wellhub/ecc'),
      (1,'PROMO','Sconti e Promozioni','Tracking perdite revenue da sconti applicati')
    `);
    console.log("[OK] Seeded cost_centers");
  }

  // 7. Seeding accounting_periods
  const [ap] = await connection.query(`SELECT COUNT(*) as c FROM accounting_periods`);
  if ((ap as any)[0].c === 0) {
    await connection.query(`
      INSERT INTO accounting_periods
        (tenant_id,year,month,label)
      VALUES
      (1,2025,9,'Settembre 2025'),
      (1,2025,10,'Ottobre 2025'),
      (1,2025,11,'Novembre 2025'),
      (1,2025,12,'Dicembre 2025'),
      (1,2026,1,'Gennaio 2026'),
      (1,2026,2,'Febbraio 2026'),
      (1,2026,3,'Marzo 2026'),
      (1,2026,4,'Aprile 2026'),
      (1,2026,5,'Maggio 2026'),
      (1,2026,6,'Giugno 2026')
    `);
    console.log("[OK] Seeded accounting_periods");
  }

  await connection.end();
}

main().catch(console.error);
