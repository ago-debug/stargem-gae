const fs = require('fs');

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;
  for (const [search, replace] of replacements) {
    content = content.replace(new RegExp(search, 'g'), replace);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}

replaceInFile('client/src/components/app-sidebar.tsx', [
  ['title: "Anagrafica Generale"', 'title: "Utente"']
]);

replaceInFile('client/src/pages/members.tsx', [
  ['>Anagrafica Generale<', '>Utente<'],
  ['title="Esporta Anagrafica"', 'title="Esporta Utenti"'],
  ['Anagrafica a Lista', 'Utente a Lista']
]);

replaceInFile('client/src/components/QuickMemberAddModal.tsx', [
  ['Anagrafica creata con successo', 'Utente creato con successo'],
  ['Aggiunta Rapida Anagrafica', 'Aggiunta Rapida Utente']
]);

replaceInFile('client/src/components/member-edit-dialog.tsx', [
  ['Anagrafica aggiornata con successo', 'Utente aggiornato con successo'],
  ['Modifica Rapida Anagrafica', 'Modifica Rapida Utente']
]);

replaceInFile('client/src/components/crm/TabAnagrafica.tsx', [
  ['>\\s*Anagrafica\\s*<', '>Utente<']
]);

replaceInFile('client/src/pages/maschera-input-generale.tsx', [
  ['label: "Anagrafica"', 'label: "Utente"']
]);

replaceInFile('client/src/pages/gempass.tsx', [
  ['Sezione A — Ricerca Anagrafica', 'Sezione A — Ricerca Utente']
]);

replaceInFile('client/src/pages/payments.tsx', [
  ['title="Modifica Anagrafica"', 'title="Modifica Utente"']
]);

replaceInFile('client/src/pages/iscritti_per_attivita.tsx', [
  ['>Modifica Anagrafica<', '>Modifica Utente<']
]);

replaceInFile('client/src/pages/anagrafica-home.tsx', [
  ['label: "Anagrafica"', 'label: "Utente"'],
  ['Sistema di Gestione Anagrafica', 'Sistema di Gestione Utente'],
  ['Esporta Anagrafica', 'Esporta Utenti'],
  ['>\\s*Anagrafica\\s*<', '>Utente<']
]);

replaceInFile('client/src/pages/studio-bookings.tsx', [
  ['Anagrafica Completa Nuovo Partecipante', 'Profilo Completo Nuovo Utente']
]);

replaceInFile('client/src/pages/calendar.tsx', [
  ['Anagrafica Completa Nuovo Partecipante', 'Profilo Completo Nuovo Utente']
]);

replaceInFile('client/src/pages/access-control.tsx', [
  ['Ricerca Anagrafica', 'Ricerca Utente']
]);

replaceInFile('client/src/pages/gemstaff.tsx', [
  ['Anagrafica Insegnanti', 'Profilo Insegnanti']
]);

replaceInFile('client/src/components/gempass/TabCertificati.tsx', [
  ['la scheda Anagrafica', 'la scheda Utente']
]);

replaceInFile('client/src/components/gempass/TabTessereEnte.tsx', [
  ['la scheda Anagrafica', 'la scheda Utente']
]);
