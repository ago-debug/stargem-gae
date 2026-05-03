const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./db_monitor_output.json', 'utf8'));

// Existing overrides
const tableOverrides = {
  "members": "Anagrafica e Profilo",
  "payments": "Pagamenti e Ricevute",
  "courses": "Corsi e Attività",
  "memberships": "Tessere Associative",
  "enrollments": "Iscrizioni (Link Membro-Corso)",
  "companyAgreements": "Convenzioni Aziendali",
  "memberDiscounts": "Sconti Utente",
  "teamMonthlyReports": "Report Mensili Team",
  "promoRules": "Regole Promozionali",
  "carnetWallets": "Carnet / Pacchetti Ingressi",
  "pricingRules": "Regole di Prezzo",
  "instructorAgreements": "Contratti Insegnanti",
  "strategicEvents": "Programmazione Strategica",
  "studioBookings": "Prenotazioni Sale",
  "users": "Utenti di Sistema (Login)",
  "journalEntries": "Prima Nota Contabile",
  "activities": "Calendario Attività Singole",
  "studios": "Sale e Spazi",
  "staffRates": "Tariffe Staff",
  "priceMatrix": "Matrice Prezzi",
  "teamLeaveRequests": "Richieste Ferie/Permessi Team",
  "staffSostituzioni": "Sostituzioni Staff",
  "teamShiftDiaryEntries": "Diario Turni Team",
  "gemConversations": "Conversazioni Messaggistica",
  "gemMessages": "Messaggi",
  "memberFormsSubmissions": "Moduli Compilati Utenti",
  "memberUploads": "Caricamenti Documenti Utenti",
  "payslips": "Buste Paga",
  "teamEmployees": "Dipendenti Team",
  "teamNotes": "Note Team",
};

const commonCols = {
    "id": {label: "ID Univoco", loc: "Sistema Centrale"},
    "tenantId": {label: "ID Tenant (Multisito)", loc: "Logica Multi-tenant"},
    "createdAt": {label: "Data Creazione", loc: "Log di Sistema"},
    "updatedAt": {label: "Data Aggiornamento", loc: "Log di Sistema"},
    "deletedAt": {label: "Data Eliminazione", loc: "Cestino / Audit"},
    "deletedBy": {label: "Eliminato Da", loc: "Cestino / Audit"},
    "created_at": {label: "Data Creazione", loc: "Log di Sistema"},
    "updated_at": {label: "Data Aggiornamento", loc: "Log di Sistema"},
    "memberId": {label: "ID Utente (Relazione)", loc: "Collegamento TabAnagrafica"},
    "userId": {label: "ID Autore (Relazione)", loc: "Collegamento Operatore"},
    "employeeId": {label: "ID Dipendente (Relazione)", loc: "Gestione Team"},
    "instructorId": {label: "ID Insegnante (Relazione)", loc: "Assegnazione Corsi"},
    "courseId": {label: "ID Corso (Relazione)", loc: "Collegamento Attività"},
    "status": {label: "Stato", loc: "Gestione Stato"},
    "active": {label: "Attivo?", loc: "Flag Visibilità"},
    "notes": {label: "Note", loc: "Campo Testuale Libero"},
    "description": {label: "Descrizione", loc: "Campo Testuale"},
    "price": {label: "Prezzo", loc: "Logica Finanziaria"},
    "amount": {label: "Importo", loc: "Logica Finanziaria"},
    "name": {label: "Nome", loc: "Identificativo Principale"},
    "color": {label: "Colore UI", loc: "Personalizzazione Grafica"},
    "sortOrder": {label: "Ordine (Ordinamento)", loc: "Visualizzazione Elenchi"},
};

const existingColumnMappings = {
  "members": {
    "id": { label: "ID Univoco", location: "Sistema Centrale" },
    "firstName": { label: "Nome", location: "TabAnagrafica > Dati Personali" },
    "lastName": { label: "Cognome", location: "TabAnagrafica > Dati Personali" },
    "fiscalCode": { label: "Codice Fiscale", location: "TabAnagrafica > Dati Personali" },
    "email": { label: "Email Principale", location: "TabAnagrafica > Contatti" },
    "phone": { label: "Telefono Fisso", location: "TabAnagrafica > Contatti" },
    "mobile": { label: "Cellulare", location: "TabAnagrafica > Contatti" },
    "dateOfBirth": { label: "Data di Nascita", location: "TabAnagrafica > Dati Personali" },
    "placeOfBirth": { label: "Luogo di Nascita", location: "TabAnagrafica > Dati Personali" },
    "gender": { label: "Sesso", location: "TabAnagrafica > Dati Personali" },
    "address": { label: "Indirizzo", location: "TabAnagrafica > Residenza" },
    "city": { label: "Città", location: "TabAnagrafica > Residenza" },
    "province": { label: "Provincia", location: "TabAnagrafica > Residenza" },
    "postalCode": { label: "CAP", location: "TabAnagrafica > Residenza" },
    "isMinor": { label: "È Minorenne?", location: "Logica Backend (Calcolata)" },
    "companyName": { label: "Ragione Sociale", location: "TabAnagrafica > Accordion Fatturazione" },
    "pIva": { label: "Partita IVA", location: "TabAnagrafica > Accordion Fatturazione" },
    "codiceFe": { label: "Codice SDI", location: "TabAnagrafica > Accordion Fatturazione" },
    "emailPec": { label: "PEC", location: "TabAnagrafica > Accordion Fatturazione" },
    "tutor1FiscalCode": { label: "Codice Fiscale Gen.1", location: "TabAnagrafica > Accordion Tutori" },
    "tutor1Phone": { label: "Telefono Gen.1", location: "TabAnagrafica > Accordion Tutori" },
    "tutor2FiscalCode": { label: "Codice Fiscale Gen.2", location: "TabAnagrafica > Accordion Tutori" },
    "emergencyContact1Name": { label: "Nome Emergenza 1", location: "TabAnagrafica > Accordion Emergenza" },
    "emergencyContact1Phone": { label: "Telefono Emergenza 1", location: "TabAnagrafica > Accordion Emergenza" },
    "sizeShirt": { label: "Taglia Maglia", location: "TabAnagrafica > Accordion Merchandising" },
    "iban": { label: "IBAN", location: "TabAnagrafica > Accordion Dati Bancari" },
    "alboNumero": { label: "Numero Albo", location: "TabAnagrafica > Accordion Professionale" },
    "socialInstagram": { label: "Instagram", location: "TabAnagrafica > Accordion Social" },
    "active": { label: "Stato Attivo", location: "Badge Intestazione" },
  },
  "payments": {
    "id": { label: "ID Pagamento", location: "Sistema Centrale" },
    "amount": { label: "Importo Pagato", location: "TabPagamenti > Modale Nuovo Pagamento" },
    "type": { label: "Tipo Transazione", location: "TabPagamenti > Griglia" },
    "description": { label: "Descrizione", location: "TabPagamenti > Riga Dettaglio" },
    "status": { label: "Stato (Saldato/Rata)", location: "TabPagamenti > Badge Stato" },
    "dueDate": { label: "Data Scadenza", location: "TabPagamenti > Gestione Rate" },
    "paidDate": { label: "Data Pagamento", location: "TabPagamenti > Ricevuta" },
    "paymentMethod": { label: "Metodo (Contanti/POS...)", location: "TabPagamenti > Modale Nuovo Pagamento" },
    "discountCode": { label: "Codice Sconto", location: "TabPagamenti > Sezione Sconti" },
    "deposit": { label: "Acconto", location: "TabPagamenti > Gestione Rate" },
    "annualBalance": { label: "Saldo Annuale", location: "TabPagamenti > Ricalcolo Backend" },
    "gbrhIban": { label: "IBAN (Bonifici)", location: "TabPagamenti > Campi Dinamici Bonifico" },
    "accountingCode": { label: "Codice Contabile", location: "Scheda Contabile" },
  },
  "courses": {
    "sku": { label: "Codice Univoco (SKU)", location: "Impostazioni Corso" },
    "name": { label: "Nome Corso", location: "Intestazione Scheda Corso" },
    "activityType": { label: "Tipo Attività (es. Corso)", location: "Filtri Ricerca" },
    "price": { label: "Prezzo Base", location: "Scheda Corso > Listino" },
    "maxCapacity": { label: "Capacità Massima", location: "Scheda Corso > Regole" },
    "instructorId": { label: "Insegnante", location: "Scheda Corso > Assegnazione" },
    "schedule": { label: "Orario", location: "Scheda Corso > Planning" },
  },
  "memberships": {
    "membershipNumber": { label: "Numero Tessera", location: "TabTessere > Dettaglio" },
    "issueDate": { label: "Data Emissione", location: "TabTessere > Form" },
    "expiryDate": { label: "Data Scadenza", location: "TabTessere > Form" },
    "status": { label: "Stato (Attiva/Scaduta)", location: "TabTessere > Badge" },
    "isRenewal": { label: "È Rinnovo?", location: "Logica Automatica Backend" },
    "fee": { label: "Quota Versata", location: "Integrazione Pagamenti" },
  },
  "enrollments": {
    "participationType": { label: "Tipo Iscrizione (Annuale/Quad)", location: "TabIscrizioni > Dettaglio" },
    "targetDate": { label: "Data Iscrizione", location: "TabIscrizioni > Storico" },
    "status": { label: "Stato Frequenza", location: "TabIscrizioni > Badge" },
    "pendingMedicalCert": { label: "In Attesa Certificato", location: "Alert Sistema" },
  }
};

let output = "export const tableTranslations: Record<string, string> = {\n";

data.forEach(item => {
    let t = item.table;
    let label = tableOverrides[t];
    if (!label) {
        label = t.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    output += `  "${t}": "${label}",\n`;
});
output += "};\n\n";

output += "export const columnMappings: Record<string, Record<string, { label: string, location: string }>> = {\n";

data.forEach(item => {
    let t = item.table;
    let cols = item.columns;
    output += `  "${t}": {\n`;
    
    const existingMap = existingColumnMappings[t] || {};
    
    cols.sort().forEach(c => {
        if (existingMap[c]) {
            output += `    "${c}": { label: "${existingMap[c].label}", location: "${existingMap[c].location}" },\n`;
        } else if (commonCols[c]) {
            output += `    "${c}": { label: "${commonCols[c].label}", location: "${commonCols[c].loc}" },\n`;
        } else {
            let autoLabel = c.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            autoLabel = autoLabel.replace(/Id$/, ' ID');
            output += `    "${c}": { label: "${autoLabel}", location: "In App / Relazionale" },\n`;
        }
    });
    output += `  },\n`;
});

output += "};\n";

fs.writeFileSync('./client/src/config/db-monitor-mapping.ts', output);
console.log("Mappings generated successfully!");
