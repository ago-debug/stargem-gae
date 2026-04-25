const fs = require('fs');

function patchFile(path, regex, replacement, importStatement) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  if (content.includes('ExportWizard')) return; // Già fatto

  // Add import safely after standard imports
  if (importStatement) {
    content = content.replace(/(import React.*?;\n|import \{.*?\} from "lucide-react";\n)/, `$1${importStatement}\n`);
  }

  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
  console.log(`Patched ${path}`);
}

// 2. payments.tsx
patchFile('client/src/pages/payments.tsx',
  /<Button\s+variant="outline"[\s\S]*?Esporta CSV\s*<\/Button>/,
  `<ExportWizard 
      filename="pagamenti"
      title="Esporta Pagamenti"
      apiEndpoint="/api/export"
      apiParams={{ table: 'payments' }}
      columns={[
        { key: 'lastName', label: 'Cognome', default: true },
        { key: 'firstName', label: 'Nome', default: true },
        { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
        { key: 'amount', label: 'Importo', default: true },
        { key: 'paymentMethod', label: 'Metodo', default: true },
        { key: 'dueDate', label: 'Data', default: true },
        { key: 'operator', label: 'Operatore', default: true },
        { key: 'period', label: 'Periodo', default: true },
        { key: 'description', label: 'Descrizione' },
        { key: 'status', label: 'Stato' }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 3. accounting-sheet.tsx
patchFile('client/src/pages/accounting-sheet.tsx',
  /<Button variant="outline" onClick=\{handleExportCSV\}[^>]*>[\s\S]*?Esporta CSV\s*<\/Button>/,
  `<ExportWizard 
      filename="estratto_conto"
      title="Esporta Estratto Conto"
      data={payments || []}
      columns={[
        { key: 'date', label: 'Data', default: true },
        { key: 'description', label: 'Descrizione', default: true },
        { key: 'amount', label: 'Importo', default: true },
        { key: 'status', label: 'Stato', default: true },
        { key: 'type', label: 'Tipo' }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 4. courses.tsx
patchFile('client/src/pages/courses.tsx',
  /<Button\s+variant="outline"\s+onClick=\{exportToCSV\}[\s\S]*?Esporta CSV\s*<\/Button>/,
  `<ExportWizard 
      filename="corsi"
      title="Esporta Corsi"
      apiEndpoint="/api/export"
      apiParams={{ table: 'courses' }}
      columns={[
        { key: 'name', label: 'Nome Corso', default: true },
        { key: 'sku', label: 'SKU', default: true },
        { key: 'category', label: 'Categoria', default: true },
        { key: 'location', label: 'Sede', default: true },
        { key: 'capacity', label: 'Capienza', default: true },
        { key: 'status', label: 'Stato', default: true }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 5. workshops.tsx
patchFile('client/src/pages/workshops.tsx',
  /<Button\s+variant="outline"\s+onClick=\{exportToCSV\}[\s\S]*?Esporta CSV\s*<\/Button>/,
  `<ExportWizard 
      filename="workshops"
      title="Esporta Workshops"
      apiEndpoint="/api/export"
      apiParams={{ table: 'workshops' }}
      columns={[
        { key: 'name', label: 'Nome Workshop', default: true },
        { key: 'sku', label: 'SKU', default: true },
        { key: 'instructor', label: 'Insegnante', default: true },
        { key: 'date', label: 'Data', default: true },
        { key: 'price', label: 'Prezzo', default: true }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 6. studio-bookings.tsx
patchFile('client/src/pages/studio-bookings.tsx',
  /<Button variant="outline" className="gap-2 text-sm" onClick=\{downloadCSV\}>[\s\S]*?Esporta CSV\s*<\/Button>/,
  `<ExportWizard 
      filename="affitti"
      title="Esporta Prenotazioni"
      data={bookings || []}
      columns={[
        { key: 'room', label: 'Sala', default: true },
        { key: 'renterName', label: 'Affittuario', default: true },
        { key: 'date', label: 'Data', default: true },
        { key: 'startTime', label: 'Ora Inizio', default: true },
        { key: 'endTime', label: 'Ora Fine', default: true },
        { key: 'amount', label: 'Importo', default: true }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 7. reports.tsx
patchFile('client/src/pages/reports.tsx',
  /<Button\s+variant="outline"\s+onClick=\{exportCSV\}\s+disabled=\{[^}]+\}\s*>\s*<Download className="w-4 h-4 mr-2" \/>\s*Esporta CSV\s*<\/Button>/,
  `<ExportWizard 
      filename="report"
      title="Esporta Report"
      data={reportResult?.data || []}
      columns={[
        { key: 'id', label: 'ID', default: true },
        { key: 'lastName', label: 'Cognome', default: true },
        { key: 'firstName', label: 'Nome', default: true },
        { key: 'amount', label: 'Importo', default: true },
        { key: 'date', label: 'Data', default: true },
        { key: 'status', label: 'Stato', default: true }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 8. gemteam.tsx (2 buttons)
patchFile('client/src/pages/gemteam.tsx',
  /<Button variant="outline" size="sm" onClick=\{handleExportReport\}>[\s\S]*?Esporta \.xlsx\s*<\/Button>/,
  `<ExportWizard 
      filename="presenze_gemteam"
      title="Esporta Presenze GemTeam"
      apiEndpoint="/api/export"
      apiParams={{ table: 'gemteam' }}
      columns={[
        { key: 'lastName', label: 'Cognome', default: true },
        { key: 'firstName', label: 'Nome', default: true },
        { key: 'role', label: 'Ruolo', default: true },
        { key: 'totalHours', label: 'Ore Totali', default: true },
        { key: 'status', label: 'Stato', default: true }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 9. maschera-input-generale.tsx
patchFile('client/src/pages/maschera-input-generale.tsx',
  /<Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-esporta" onClick=\{handleExport\}>[\s\S]*?Esporta\s*<\/Button>/,
  `<ExportWizard 
      filename="membro"
      title="Esporta Membro"
      data={member ? [member] : []}
      columns={[
        { key: 'lastName', label: 'Cognome', default: true },
        { key: 'firstName', label: 'Nome', default: true },
        { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
        { key: 'email', label: 'Email', default: true },
        { key: 'phone', label: 'Telefono', default: true }
      ]}
    />`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);

// 10. anagrafica-home.tsx (Multiple buttons)
// We replace the 3 export buttons with 1 export wizard
patchFile('client/src/pages/anagrafica-home.tsx',
  /<div className="hidden lg:flex gap-2">[\s\S]*?<\/div>/,
  `<div className="hidden lg:flex gap-2">
      <ExportWizard 
        filename="anagrafica_completa"
        title="Esporta Anagrafica"
        apiEndpoint="/api/export"
        apiParams={{ table: 'members' }}
        columns={[
          { key: 'lastName', label: 'Cognome', default: true },
          { key: 'firstName', label: 'Nome', default: true },
          { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
          { key: 'email', label: 'Email', default: true },
          { key: 'phone', label: 'Telefono', default: true },
          { key: 'cardNumber', label: 'Tessera', default: true },
          { key: 'hasMedicalCertificate', label: 'Cert. Medico', default: true },
          { key: 'dateOfBirth', label: 'Data di Nascita' },
          { key: 'placeOfBirth', label: 'Luogo Nascita' },
          { key: 'city', label: 'Città' },
          { key: 'province', label: 'Provincia' }
        ]}
      />
    </div>`,
  `import { ExportWizard } from "@/components/ExportWizard";`
);
