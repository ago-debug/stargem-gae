import { db } from "./server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";

async function main() {
  console.log("=== APPLYING MIGRATION ===");
  const migrationSql = fs.readFileSync("./migrations/0014_agevolazioni_completo.sql", "utf-8");
  const queries = migrationSql.split("--> statement-breakpoint").map(q => q.trim()).filter(Boolean);
  
  for (const query of queries) {
    try {
        await db.execute(sql.raw(query));
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_CANT_DROP_FIELD_OR_KEY' || e.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log("Skipping existing:", e.message);
        } else {
            console.error("Migration Error:", e);
            throw e;
        }
    }
  }
  console.log("Migration applied!");

  console.log("\\n=== STEP 1: UPDATE PROMO_RULES ===");
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Auto' WHERE target_type = 'public';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Direzione' WHERE target_type = 'company';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Direzione' WHERE code IN ('2526STAFF60','2526STAFF70','2526WS.ST4FF20');`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Elisa' WHERE code LIKE '2526ELISA%';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Gaetano' WHERE code LIKE '2526GAE%';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Estefany' WHERE code LIKE '2526ESTEFANY%';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Alexandra' WHERE code LIKE '2526ALEXANDRA%';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Direzione' WHERE code LIKE '2526DIREZIONE%' OR code LIKE '2526DIREZPERS%';`);
  await db.execute(sql`UPDATE promo_rules SET approved_by = 'Direzione' WHERE code IN ('2526VIP75','2526VIDEO30','2526VIDEO50','2526VIDEO100','2526DOPOPROVA05','2526GIUDITTA10','2526MASSI10','2526MODULOLUN09.Y','2425OPENPAGATO100');`);

  console.log("\\n=== STEP 6: SEED DATI REALI ===");
  console.log("Seeding staff_rates...");
  await db.execute(sql`
    INSERT IGNORE INTO staff_rates
      (tenant_id, service_code, service_label, amount, rate_type, applicable_to, studio_restriction, requires_membership, requires_medical_cert, notes)
    VALUES
    (1, 'allenamento_autonomo', 'Allenamento autonomo in Studio 1 o 2', 150.00, 'annual', 'all_staff', 'Studio 1, Studio 2', true, true, 'Tariffa annuale fissa per tutto lo staff. Obbligatori tessera 25€ e certificato medico. Autorizzato da Direzione.'),
    (1, 'workshop_staff_discount', 'Workshop a tariffa Staff -20%', 0.00, 'per_session', 'all_staff', NULL, true, true, 'Sconto 20% su tutti i workshop per staff. Codice: 2526WS.ST4FF20.'),
    (1, 'corso_insegnante_fisso', 'Corso per Insegnanti (no Aerial)', 150.00, 'annual', 'insegnante', NULL, true, true, 'Tariffa fissa 150€ indipendente dal mese. Da settembre a luglio. Obbligatori tessera e certificato medico.');
  `);

  console.log("Seeding company_agreements...");
  await db.execute(sql`
    INSERT INTO company_agreements
      (tenant_id, company_name, company_type, discount_courses, discount_merch, exclude_open, exclude_other_promos, eligible_who, special_rules, requires_verification, verification_notes, approved_by, is_active, promo_rule_id)
    VALUES
    (1,'Università Bocconi','universita', 20.00, 10.00, true, true, 'Studenti e dipendenti', NULL, true, 'Email universitaria o badge dipendente', 'Direzione', true, (SELECT id FROM promo_rules WHERE code='2526BOCCONI20' LIMIT 1)),
    (1,'Università Bicocca','universita', 20.00, 10.00, true, true, 'Personale docente e non docente, dottorandi, specializzandi, studenti regolarmente iscritti, collaboratori, alumni associazione Bicocca Alumni', NULL, true, 'Badge universitario o email istituzionale', 'Direzione', true, (SELECT id FROM promo_rules WHERE code='2526BICOCCA20' LIMIT 1)),
    (1,'Università degli Studi di Milano','universita', 20.00, 10.00, true, true, 'Studenti e dipendenti', NULL, true, 'Email universitaria o badge', 'Direzione', true, NULL),
    (1,'Istituto Marangoni','universita', 20.00, 10.00, true, true, 'Studenti e dipendenti', NULL, true, 'Badge istituto', 'Direzione', true, NULL),
    (1,'Forze dell Ordine','forze_ordine', 20.00, 0.00, true, true, 'Polizia, Carabinieri, Finanza e Guardia di Finanza. Esteso a mogli/mariti e figli.', NULL, true, 'Tesserino identificativo in corso di validità', 'Direzione', true, (SELECT id FROM promo_rules WHERE code='2526FORZEORDINE20' LIMIT 1)),
    (1,'Poste Italiane','azienda', 20.00, 0.00, true, true, 'Dipendenti Poste Italiane', NULL, true, 'Badge dipendente Poste', 'Direzione', true, NULL),
    (1,'Credit Agricole','azienda', 20.00, 0.00, true, true, 'Dipendenti Credit Agricole', NULL, true, 'Badge dipendente', 'Direzione', true, (SELECT id FROM promo_rules WHERE code='2526CREDITAGRICOL20' LIMIT 1)),
    (1,'Avvocati e dipendenti 4° piano', 'studio_professionale', 30.00, 0.00, true, true, 'Avvocati e dipendenti dello studio al 4° piano', NULL, true, 'Verifica con Direzione', 'Direzione', true, (SELECT id FROM promo_rules WHERE code='2526AVV4PIANO30' LIMIT 1)),
    (1,'Avvale Spa (ex Techedge)','azienda', 20.00, 10.00, true, true, 'Dipendenti Avvale Spa', NULL, true, 'Badge aziendale', 'Direzione', true, (SELECT id FROM promo_rules WHERE code='2526AVVALE20' LIMIT 1)),
    (1,'Scuola Leonardo Da Vinci','scuola', 20.00, 0.00, true, true, 'Studenti e insegnanti della scuola', '50€ per open fitness/ballo/danza x 1 mese (tessera esclusa). OPPURE -20% abbonamenti stagionali per studenti. OPPURE -30% abbonamenti stagionali per insegnanti. Nulla è cumulabile con promozioni già attive. NO abbonamenti OPEN per le altre categorie.', true, 'Tesserino scolastico o documento', 'Direzione', true, NULL),
    (1,'Modulo Academy','accademia', 100.00, 0.00, false, true, 'Allievi e maestri Modulo Academy', 'Accesso gratuito a tutti i corsi tranne Aerial, solo se c è posto disponibile.', false, NULL, 'Direzione', true, NULL);
  `);

  console.log("\\n=== STEP 9: VERIFICA FINALE ===");
  const [md] = await db.execute(sql`SELECT COUNT(*) as c FROM member_discounts;`);
  const [ca] = await db.execute(sql`SELECT COUNT(*) as c FROM company_agreements;`);
  const [sr] = await db.execute(sql`SELECT COUNT(*) as c FROM staff_rates;`);
  console.log(`member_discounts:${md[0].c}, company_agreements:${ca[0].c}, staff_rates:${sr[0].c}`);

  const [res_ca] = await db.execute(sql`SELECT company_name, company_type, discount_courses, discount_merch, exclude_open FROM company_agreements ORDER BY company_name;`);
  console.log("company_agreements:");
  console.table(res_ca);

  const [res_sr] = await db.execute(sql`SELECT service_code, service_label, amount, rate_type FROM staff_rates ORDER BY service_code;`);
  console.log("staff_rates:");
  console.table(res_sr);

  const [res_pr] = await db.execute(sql`SELECT COUNT(*) as totale, approved_by FROM promo_rules GROUP BY approved_by ORDER BY totale DESC;`);
  console.log("promo_rules (approved_by):");
  console.table(res_pr);

  process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
