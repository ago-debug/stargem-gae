const fs = require('fs');

function translateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Translate "X not found" to "X non trovato/a"
  content = content.replace(/throw new Error\("([^"]+) not found"\)/g, 'throw new Error("$1 non trovato")');
  content = content.replace(/throw new Error\('([^']+) not found'\)/g, "throw new Error('$1 non trovato')");

  // Some specifics
  content = content.replace(/"Role non trovato/g, '"Ruolo non trovato');
  content = content.replace(/"User non trovato/g, '"Utente non trovato');
  content = content.replace(/"Studio non trovato/g, '"Studio/Sala non trovato');
  content = content.replace(/"Studio booking non trovato/g, '"Prenotazione sala non trovata');
  content = content.replace(/"Booking service non trovato/g, '"Servizio prenotazione non trovato');
  content = content.replace(/"Payment note non trovato/g, '"Nota di pagamento non trovata');
  content = content.replace(/"Enrollment detail non trovato/g, '"Dettagli iscrizione non trovati');

  // Missing parameters
  content = content.replace(/Missing required parameters for/g, 'Parametri mancanti per');

  // Invalid parameters
  content = content.replace(/Invalid issueDate provided to/g, 'Data di rilascio non valida in');
  content = content.replace(/Invalid membershipNumber provided for/g, 'Numero tessera non valido per');

  fs.writeFileSync(filePath, content, 'utf8');
}

translateFile('./server/storage.ts');
translateFile('./server/utils/season.ts');
console.log('Done storage & utils');
