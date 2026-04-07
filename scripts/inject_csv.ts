import fs from 'fs';
const target = 'client/src/pages/studio-bookings.tsx';
let content = fs.readFileSync(target, 'utf8');

// Add imports
if (!content.includes('ActivityNavMenu')) {
  // Add download icon and arrowleft
  content = content.replace(
    'import {',
    'import { ActivityNavMenu } from "@/components/activity-nav-menu";\nimport {'
  );
  content = content.replace(
    'Plus,',
    'Plus,\n    Download,\n    ArrowLeft,'
  );
}

// Add downloadCSV function inside StudioBookings
const csvFn = `
    const downloadCSV = () => {
        if (!bookings || bookings.length === 0) return;
        const headers = ["Data", "Orario", "Sala", "Insegnante", "Servizio", "Partecipante", "Stato", "Pagato", "Importo"];
        const rows = filteredBookings.map(b => [
            format(new Date(b.bookingDate), 'dd/MM/yyyy'),
            \`\${b.startTime} - \${b.endTime}\`,
            b.studioName || "Sala",
            b.instructorFirstName ? \`\${b.instructorFirstName} \${b.instructorLastName}\` : "Nessuno",
            b.serviceName || b.title || "Servizio",
            b.memberFirstName ? \`\${b.memberFirstName} \${b.memberLastName}\` : (b.title || "-"),
            b.status === 'confirmed' ? "Confermata" : b.status === 'pending' ? "In attesa" : "Annullata",
            b.paid ? "Pagato" : "Da pagare",
            \`€ \${Number(b.amount || 0).toFixed(2)}\`
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(row => row.map(cell => \`"\${cell}"\`).join(";"))
        ].join("\\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", \`esportazione_affitti_\${format(new Date(), 'yyyy-MM-dd')}.csv\`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
`;

if (!content.includes('const downloadCSV = () =>')) {
    content = content.replace(
        'return (',
        csvFn + '\n    return ('
    );
}

// Replace header
const newHeader = `
        <div className="p-4 md:p-6 space-y-6 mx-auto">
            <ActivityNavMenu />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">Riepilogo Affitti</h1>
                    </div>
                    <p className="text-muted-foreground ml-11">Gestione completa delle prenotazioni e affitti</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 text-sm" onClick={downloadCSV}>
                        <Download className="h-4 w-4" />
                        Esporta CSV
                    </Button>
                    <Button onClick={handleCreateBooking} className="font-semibold text-black gap-2 max-w-[200px]" style={{ backgroundColor: "#ffb000" }}>
                        <Plus className="w-5 h-5" /> Nuova Prenotazione
                    </Button>
                </div>
            </div>
`;

content = content.replace(
    /<div className="p-6 md:p-8 space-y-6 mx-auto">\s*<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">[\s\S]*?<\/Button>\s*<\/div>/,
    newHeader
);

fs.writeFileSync(target, content, 'utf8');
