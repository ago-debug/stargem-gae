import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

const dipendenti = [
  { u: 'Alexandra', f: 'ALEXANDRA', l: 'MALDONADO', team: 'segreteria', tariffa: 9.00 },
  { u: 'Giuditta', f: 'GIUDITTA', l: 'FUMAGALLI', team: 'segreteria', tariffa: 10.00 },
  { u: 'Estefany', f: 'ESTEFANY', l: 'SEGURA', team: 'segreteria', tariffa: 9.00 },
  { u: 'Nura', f: 'NURA', l: 'HANI', team: 'segreteria', tariffa: 8.00 },
  { u: 'Joel', f: 'JOEL', l: 'VILLON', memberId: 9325, team: 'segreteria', tariffa: 8.00 },
  { u: 'Kevin', f: 'KEVIN', l: 'BONILLA', memberId: 4687, team: 'ass_manutenzione', tariffa: 8.00 },
  { u: 'Jasir', f: 'JASIR', l: 'BLANCO', team: 'ass_manutenzione', tariffa: 7.00 },
  { u: 'Diego', f: 'DIEGO', l: 'CANDELARIO', team: 'ass_manutenzione', tariffa: 7.00 },
  { u: 'Sara', f: 'SARA', l: 'JANNELLI', team: 'ufficio', tariffa: 9.00 },
  // Massi's DB first_name is 'MASSIMILIANO VALENTINO' but previously we mapped him via Massi user with ID 847
  { u: 'Massi', f: 'MASSIMILIANO VALENTINO', l: 'NEMBRI', memberId: 847, team: 'ufficio', tariffa: 9.00 },
  { u: 'Santo', f: 'SANTO', l: 'MANTICE', memberId: 3419, team: 'amministrazione', tariffa: null },
  { u: 'Elisa', f: 'ELISA', l: 'ARRIVABENE', memberId: 2488, team: 'amministrazione', tariffa: null },
  { u: 'Gaetano', f: 'GAETANO', l: 'AMBROSIO', memberId: 2490, team: 'amministrazione', tariffa: null },
  { u: 'Stefano', f: 'STEFANO', l: 'SARACCHI', memberId: 9122, team: 'ufficio', tariffa: null },
];

async function run() {
  try {
    // --- STEP B: SEED TEAM EMPLOYEES ---
    console.log("Fetching new members...");
    const memRes = await db.execute(sql`SELECT id, first_name, last_name, user_id FROM members WHERE participant_type = 'DIPENDENTE'`);
    const dbMembers = memRes[0] as any[];

    console.log(`Inserting ${dipendenti.length} employees...`);
    for (const d of dipendenti) {
      let mId = d.memberId;
      let uId = null;

      if (!mId) {
        // Find by name
        let found = dbMembers.find(m => m.first_name === d.f && m.last_name === d.l);
        if (found) {
          mId = found.id;
          uId = found.user_id;
        } else {
          console.warn(`Nuovo member non trovato per ${d.f} ${d.l}!`);
        }
      } else {
        let found = dbMembers.find(m => m.id === mId);
        if (found) {
          uId = found.user_id;
        }
      }

      if (mId) {
        await db.execute(sql`
          INSERT INTO team_employees (member_id, user_id, team, tariffa_oraria, stipendio_fisso_mensile, attivo)
          VALUES (${mId}, ${uId}, ${d.team}, ${d.tariffa}, NULL, 1)
        `);
      }
    }
    console.log("[OK] Seed team_employees completato.");

    // --- STEP C: SEED ACTIVITY TYPES ---
    const q1 = `INSERT INTO team_activity_types (team, label, categoria, sort_order) VALUES
('segreteria','Compilato le schede corsi','database',1),
('segreteria','Estrapolato e inviato Email','email',2),
('segreteria','Estrapolato e inviato SMS','sms',3),
('segreteria','Informazioni in sede','reception',4),
('segreteria','Informazioni in sede + iscrizione corso + pagamento','reception',5),
('segreteria','Informazioni in sede + iscrizione WS/eventi + pagamento','reception',6),
('segreteria','Inserito nel db Athena anagrafica','database',7),
('segreteria','Inserito nel db Athena partecipazione','database',8),
('segreteria','Inserito la prenotazione su Bookly','database',9),
('segreteria','Letto, spunta e risposto su Trello','trello',10),
('segreteria','Preso le presenze','presenze',11),
('segreteria','Prenotato e compilato elenco visite mediche','medico',12),
('segreteria','Pulito e riordinato la postazione','pulizie',13),
('segreteria','Risposto al Telefono','telefono',14),
('segreteria','Risposto alle Email','email',15),
('segreteria','Risposto WA staff','whatsapp',16),
('segreteria','Telefonato per le prove','telefono',17),
('segreteria','Quote scadute: avvisato con email/sms','email',18),
('segreteria','Altro','altro',99);`;

    const q2 = `INSERT INTO team_activity_types (team, label, categoria, sort_order) VALUES
('ass_manutenzione','Aperto i piani, acceso le TV, controllato le pulizie','apertura',1),
('ass_manutenzione','Controllato presenza attrezzi negli studi','inventario',2),
('ass_manutenzione','Pulito attrezzi negli studi','pulizie',3),
('ass_manutenzione','Inventario merce Adidas','inventario',4),
('ass_manutenzione','Inventario merce Freddy','inventario',5),
('ass_manutenzione','Inventario attrezzature sale','inventario',6),
('ass_manutenzione','Riordinato magazzino','magazzino',7),
('ass_manutenzione','Controllato pulizie bagni e spogliatoi','pulizie',8),
('ass_manutenzione','Controllato impianti audio','tecnico',9),
('ass_manutenzione','Controllato impianti luci','tecnico',10),
('ass_manutenzione','Appeso attrezzi per Aerial','allestimento',11),
('ass_manutenzione','Messo pali per Pole','allestimento',12),
('ass_manutenzione','Chiamato assistenza esterna','tecnico',13),
('ass_manutenzione','Altro','altro',99);`;

    const q3 = `INSERT INTO team_activity_types (team, label, categoria, sort_order) VALUES
('tutti','Riunione interna','riunione',1),
('tutti','Formazione interna','formazione',2),
('tutti','Altro','altro',99);`;

    await db.execute(sql.raw(q1));
    await db.execute(sql.raw(q2));
    await db.execute(sql.raw(q3));
    console.log("[OK] Seed team_activity_types completato.");

  } catch (e) {
    console.error("ERRORE FATALE:", e);
    process.exit(1);
  }
  process.exit(0);
}

run();
