const fs = require('fs');

let content = fs.readFileSync('./server/routes.ts', 'utf8');

// Replace standard English error messages with Italian
content = content.replace(/"Code missing"/g, '"Codice mancante"');
content = content.replace(/"Username and password are required"/g, '"Username e password obbligatori"');
content = content.replace(/"Username already exists"/g, '"Username già esistente"');
content = content.replace(/"Password is required"/g, '"Password obbligatoria"');
content = content.replace(/"You cannot delete your own account"/g, '"Non puoi eliminare il tuo stesso account"');
content = content.replace(/"Name and permissions are required"/g, '"Nome e permessi sono obbligatori"');
content = content.replace(/"Role name already exists"/g, '"Il nome del ruolo esiste già"');
content = content.replace(/"Cannot delete admin role"/g, '"Impossibile eliminare il ruolo di admin"');
content = content.replace(/"Bulk import failed: "/g, '"Importazione massiva fallita: "');
content = content.replace(/"Member not found"/g, '"Membro non trovato"');
content = content.replace(/'Google connection not found.'/g, "'Connessione Google non trovata.'");
content = content.replace(/"Autenticazione Google non configurata. Vai in Admin Panel per connettere un account."/g, '"Autenticazione Google non configurata. Vai in Admin Panel per connettere un account."');

fs.writeFileSync('./server/routes.ts', content, 'utf8');
console.log('Routes translated');
