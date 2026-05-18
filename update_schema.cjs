const fs = require('fs');

let fileContent = fs.readFileSync('shared/schema.ts', 'utf8');

// Members
const membersInsertIndex = fileContent.indexOf('attachmentMetadata:');
const membersAdditions = `
  statusLifecycle: mysqlEnum("status_lifecycle", ["attivo","sospeso","dimesso","deceduto"]).default("attivo"),
  dataIscrizione: date("data_iscrizione"),
  dataDimissione: date("data_dimissione"),
  causaDimissione: text("causa_dimissione"),
  codiceDestinatario: varchar("codice_destinatario", { length: 7 }),
  pec: varchar("pec", { length: 255 }),
  iban: varchar("iban", { length: 34 }),
  intestatarioIban: varchar("intestatario_iban", { length: 255 }),
  modPagamentoPreferita: mysqlEnum("mod_pagamento_preferita", ["contanti","bonifico","pos","sdd","assegno","altro"]),
  dataCertificatoMedico: date("data_certificato_medico"),
  tipologiaCertificato: mysqlEnum("tipologia_certificato", ["non_agonistico","agonistico","sportivo"]),
  allergie: text("allergie"),
  patologie: text("patologie"),
  farmaci: text("farmaci"),
  noteSanitarie: text("note_sanitarie"),
  tagliaAbbigliamento: varchar("taglia_abbigliamento", { length: 10 }),
  numeroScarpe: varchar("numero_scarpe", { length: 10 }),
  societyProvenienzaId: int("society_provenienza_id"),
  dataTesseramentoPrecedente: date("data_tesseramento_precedente"),
  noteProvenienza: text("note_provenienza"),
  flagMinoreProtetto: tinyint("flag_minore_protetto").default(0),
`;
if (membersInsertIndex !== -1) {
  fileContent = fileContent.substring(0, membersInsertIndex) + membersAdditions + fileContent.substring(membersInsertIndex);
}

// Team Employees
const teamInsertIndex = fileContent.indexOf('avatarUrl:', fileContent.indexOf('export const teamEmployees = mysqlTable'));
const teamAdditions = `
  compensoOrario: decimal("compenso_orario", { precision: 8, scale: 2 }),
  compensoMensile: decimal("compenso_mensile", { precision: 10, scale: 2 }),
  tipologiaContratto: mysqlEnum("tipologia_contratto", ["dipendente","collab_occasionale","collab_continuativa","partita_iva","volontario"]),
  dataInizioCollaborazione: date("data_inizio_collaborazione"),
  dataFineCollaborazione: date("data_fine_collaborazione"),
  alboProfessionale: varchar("albo_professionale", { length: 255 }),
  nIscrizioneAlbo: varchar("n_iscrizione_albo", { length: 100 }),
  dataIscrizioneAlbo: date("data_iscrizione_albo"),
  titoloStudio: varchar("titolo_studio", { length: 255 }),
  istitutoDiploma: varchar("istituto_diploma", { length: 255 }),
  annoDiploma: int("anno_diploma"),
  certificazioni: text("certificazioni"),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  instagramUrl: varchar("instagram_url", { length: 500 }),
  facebookUrl: varchar("facebook_url", { length: 500 }),
  website: varchar("website", { length: 500 }),
  curriculumUrl: varchar("curriculum_url", { length: 500 }),
  regolamentoUrl: varchar("regolamento_url", { length: 500 }),
  bioBreve: text("bio_breve"),
  specializzazione: varchar("specializzazione", { length: 255 }),
  lingueParlate: varchar("lingue_parlate", { length: 255 }),
  disponibilitaOraria: text("disponibilita_oraria"),
  noteCompenso: text("note_compenso"),
  fotoProfiloUrl: varchar("foto_profilo_url", { length: 500 }),
  coloreCalendario: varchar("colore_calendario", { length: 7 }),
`;
if (teamInsertIndex !== -1) {
  fileContent = fileContent.substring(0, teamInsertIndex) + teamAdditions + fileContent.substring(teamInsertIndex);
}

fs.writeFileSync('shared/schema.ts', fileContent);
