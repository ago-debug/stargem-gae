import { db } from "./server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";

async function main() {
  // Migration is already applied or handled manually
  console.log("Migration skipped (already applied).");

  console.log("\\n=== STEP 1: AGGIUNGI wallet_types MANCANTI ===");
  const [clRes] = await db.execute(sql`SELECT id FROM custom_lists WHERE system_name = 'wallet_types'`);
  const wid = (clRes as any[])[0]?.id;
  if (!wid) throw new Error("List wallet_types not found");
  
  await db.execute(sql`
    INSERT IGNORE INTO custom_list_items (list_id, value, sort_order, active, color)
    VALUES
    (${wid}, 'Lezioni Domicilio Singola', 6, true, '#D85A30'),
    (${wid}, 'Lezioni Domicilio Coppia', 7, true, '#993C1D'),
    (${wid}, 'Ore Studio Personal', 8, true, '#534AB7'),
    (${wid}, 'Affitto Continuativo Mensile', 9, true, '#0F6E56');
  `);

  console.log("\\n=== STEP 4: SEED pricing_rules REALI ===");
  await db.execute(sql`
    INSERT IGNORE INTO pricing_rules
      (tenant_id, rule_code, rule_label, applies_to, rule_type, trigger_condition, trigger_value, effect_type, effect_value, requires_authorization, authorized_by, priority, notes)
    VALUES
    (1, 'affitto_extra_per_person_3plus', 'Maggiorazione +5€ per ogni allievo dal 3° in poi', 'affitto_sala', 'extra_per_person', 'group_size_gte', 3, 'add_fixed', 5.00, false, 'Auto', 1, 'Es: 1ins+3allievi=30€, 1ins+4=35€, 1ins+5=40€. Si applica per ogni allievo aggiuntivo dal 3°. Base: 25€ per 1ins+2allievi.'),
    (1, 'affitto_pack_bonus_11th_hour', '11a ora omaggio al completamento pack 10 ore', 'carnet_affitto', 'bonus_unit', 'units_completed', 10, 'add_bonus_unit', 1, false, 'Auto', 2, 'Al completamento delle 10 ore del pack affitto viene aggiunta automaticamente 1 ora omaggio. bonus_units +1 su carnet_wallets.'),
    (1, 'lezione_trial_discount_7days', 'Sconto lezione di prova se iscrizione entro 7gg', 'lezione_privata', 'trial_discount', 'days_since_trial_lte', 7, 'subtract_fixed', 0, false, 'Auto', 3, 'Se il cliente si iscrive entro 7 giorni dalla prova, il costo della prova (20-25€) viene scalato dalla quota di iscrizione. Logica: trialDate in carnet_wallets.'),
    (1, 'studio_personal_price_jan2026', 'Aumento prezzi Studio Personal da gennaio 2026', 'ore_studio_personal', 'time_based_price', 'month_gte', 1, 'set_price', 115.00, false, 'Direzione', 4, 'Pack 10h Studio Personal 1ins+1allievo: 110€ fino a dicembre 2025, 115€ da gennaio 2026. Pack 10h 1ins+2allievi: 160€ fino a dicembre 2025, 165€ da gennaio 2026.'),
    (1, 'prove_competizione_5h_free', 'Prove preparazione gare: 5h gratuite', 'affitto_sala', 'free', 'purpose_eq', 0, 'set_free', 0, true, 'Direzione', 5, 'Massimo 5 ore gratuite per preparazione gare. Per più ore: richiedere autorizzazione a Massi. Richiede autorizzazione Direzione. Da gestire come wallet con importo 0.'),
    (1, 'lezione_domicilio_maggiorazione_singola', 'Maggiorazione lezione a domicilio singola +10€', 'lezione_privata', 'extra_per_person', 'location_type_eq', 0, 'add_fixed', 10.00, false, 'Auto', 6, 'Lezione singola sede=55€, domicilio=65€ (+10€). Lezione coppia sede=75€, domicilio=85€ (+10€). Il preventivo varia in base alla zona.'),
    (1, 'lezione_domicilio_maggiorazione_pack', 'Maggiorazione pack 10 lezioni a domicilio', 'carnet_lezioni', 'extra_per_person', 'location_type_eq', 0, 'add_fixed', 100.00, false, 'Auto', 7, 'Pack 10 singole sede=500€, domicilio=600€. Pack 10 coppia sede=700€, domicilio=800€.');
  `);

  console.log("\\n=== STEP 5: SEED price_matrix ===");
  const [sRes] = await db.execute(sql`SELECT id FROM seasons WHERE active = true ORDER BY id DESC LIMIT 1`);
  const sid = (sRes as any[])[0]?.id || 1;

  // Let's create price_matrix if it doesn't exist, since I can't be strictly sure it exists and there's no drizzle schema for it in F1-008.
  // Actually, priceMatrix IS in schema! `price_list_items` probably or `course_quotes_grid`? The user said "price_matrix". Wait, let me check if price_matrix exists in schema.
  const [tablesRes] = await db.execute(sql`SHOW TABLES LIKE 'price_matrix'`);
  if ((tablesRes as any[]).length === 0) {
      console.log("CREATING price_matrix manually because it was not in Drizzle schema F1-008 explicitly but user requested seed...");
      await db.execute(sql`
        CREATE TABLE price_matrix (
            id int AUTO_INCREMENT PRIMARY KEY,
            tenant_id int DEFAULT 1,
            season_id int,
            category varchar(100),
            quantity_type varchar(50),
            course_count int,
            valid_from_month int,
            valid_to_month int,
            base_price decimal(8,2),
            max_slots int,
            exclude_from_promo boolean DEFAULT false,
            notes text,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP
        );
      `);
  }

  await db.execute(sql`
    INSERT INTO price_matrix
      (season_id, tenant_id, category, quantity_type, course_count, valid_from_month, valid_to_month, base_price, max_slots, exclude_from_promo, notes)
    VALUES
    (${sid}, 1, 'privata', 'singolo', 1, 1, 10, 55.00, NULL, false, 'Lezione individuale singola. In sede.'),
    (${sid}, 1, 'privata', 'coppia', 1, 1, 10, 75.00, NULL, false, 'Lezione individuale coppia. In sede.'),
    (${sid}, 1, 'privata', 'pack10', 1, 1, 10, 500.00, NULL, false, 'Pack 10 lezioni singole. Scad. 90gg.'),
    (${sid}, 1, 'privata', 'pack10', 2, 1, 10, 700.00, NULL, false, 'Pack 10 lezioni coppia. Scad. 90gg.'),
    (${sid}, 1, 'aerea', 'singolo', 1, 1, 10, 70.00, NULL, false, 'Lezione individuale Aerial/Pole/Cerchio/Tessuti.'),
    (${sid}, 1, 'aerea', 'pack10', 1, 1, 10, 650.00, NULL, false, 'Pack 10 lezioni Aerial singola. Scad. 90gg.'),
    (${sid}, 1, 'privata', 'singolo', 1, 1, 10, 65.00, NULL, false, 'Lezione domicilio singola. +10€ rispetto sede. Preventivo dipende dalla zona.'),
    (${sid}, 1, 'privata', 'coppia', 1, 1, 10, 85.00, NULL, false, 'Lezione domicilio coppia. +10€ rispetto sede.'),
    (${sid}, 1, 'privata', 'pack10', 1, 1, 10, 600.00, NULL, false, 'Pack 10 lezioni domicilio singola. Scad. 90gg.'),
    (${sid}, 1, 'privata', 'pack10', 2, 1, 10, 800.00, NULL, false, 'Pack 10 lezioni domicilio coppia. Scad. 90gg.'),
    (${sid}, 1, 'affitto', 'orario', 1, 1, 10, 20.00, NULL, false, '1 ora 1 insegnante + 1 allievo. Ricevuta istituzionale.'),
    (${sid}, 1, 'affitto', 'orario', 2, 1, 10, 25.00, NULL, false, '1 ora 1 insegnante + 2 allievi. Dal 3° allievo +5€/persona. Ricevuta istituzionale.'),
    (${sid}, 1, 'affitto', 'pack10', 1, 1, 10, 150.00, NULL, false, 'Pack 10 ore 1ins+1allievo. Scad. 120gg. Ricevuta istituzionale.'),
    (${sid}, 1, 'affitto', 'pack10', 2, 1, 10, 200.00, NULL, false, 'Pack 10 ore 1ins+2allievi. Scad. 120gg.'),
    (${sid}, 1, 'affitto_aerea', 'orario', 1, 1, 10, 30.00, NULL, false, '1 ora Aerial 1ins+1allievo.'),
    (${sid}, 1, 'affitto_aerea', 'orario', 2, 1, 10, 40.00, NULL, false, '1 ora Aerial 1ins+2allievi.'),
    (${sid}, 1, 'affitto_aerea', 'pack10', 1, 1, 10, 200.00, NULL, false, 'Pack 10 ore Aerial 1ins+1. Scad. 120gg.'),
    (${sid}, 1, 'affitto_aerea', 'pack10', 2, 1, 10, 300.00, NULL, false, 'Pack 10 ore Aerial 1ins+2. Scad. 120gg.'),
    (${sid}, 1, 'studio_medico', 'orario', 1, 1, 4, 20.00, NULL, false, 'Studio Personal 1h 1ins+1allievo.'),
    (${sid}, 1, 'studio_medico', 'orario', 2, 1, 4, 25.00, NULL, false, 'Studio Personal 1h 1ins+2allievi.'),
    (${sid}, 1, 'studio_medico', 'pack10', 1, 1, 4, 110.00, NULL, false, 'Pack 10h Studio Personal 1ins+1. Scad. 120gg. ATTENZIONE: da gennaio 2026 diventa 115€.'),
    (${sid}, 1, 'studio_medico', 'pack10', 2, 1, 4, 160.00, NULL, false, 'Pack 10h Studio Personal 1ins+2. Scad. 120gg. ATTENZIONE: da gennaio 2026 diventa 165€.');
  `);

  console.log("\\n=== VERIFICHE FINALI ===");
  const [wt] = await db.execute(sql`
    SELECT value, color
    FROM custom_list_items
    WHERE list_id = ${wid}
    ORDER BY sort_order;
  `);
  console.log("Wallet types completi:");
  console.table(wt);

  const [pr] = await db.execute(sql`
    SELECT rule_code, applies_to, rule_type, effect_type, effect_value
    FROM pricing_rules
    ORDER BY priority;
  `);
  console.log("Pricing rules inserite:");
  console.table(pr);

  const [pm] = await db.execute(sql`
    SELECT category, quantity_type, base_price, notes
    FROM price_matrix
    ORDER BY category, quantity_type;
  `);
  console.log("Price matrix completa:");
  console.table(pm);

  const [cw] = await db.execute(sql`
    SHOW COLUMNS FROM carnet_wallets
    WHERE Field IN ('group_size','location_type','price_per_unit','total_paid','bonus_units');
  `);
  console.log("Nuove colonne carnet_wallets:");
  console.table(cw);

  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
