const fs = require('fs');
const file = './client/src/pages/gemteam.tsx';
let code = fs.readFileSync(file, 'utf8');

// --- FIX 2: MUTATIONS ---
const mutationsCode = `
  const shiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const isUpdate = !!data.id;
      const res = await fetch('/api/gemteam/turni/scheduled' + (isUpdate ? \`/\${data.id}\` : ''), {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Errore salvataggio turno');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/scheduled'] })
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(\`/api/gemteam/turni/scheduled/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore eliminazione turno');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/scheduled'] })
  });

  const weekTypeMutation = useMutation({
    mutationFn: async (settimana: string) => {
      const res = await fetch('/api/gemteam/turni/week-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          settimana
        })
      });
      if (!res.ok) throw new Error('Errore aggiornamento settimana');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gemteam/turni/week-assignment'] })
  });
  
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, team }: { id: number, team: string }) => {
      const res = await fetch(\`/api/gemteam/dipendenti/\${id}\`, { // Fallback if reorder or specific ID route missing? No, the user provided code block! We will patch /api/gemteam/dipendenti/:id
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      });
      if (!res.ok) throw new Error('Errore aggiornamento reparto');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/gemteam/dipendenti'] })
  });
  
  const { data: weekAssignment } = useQuery<any>({
    queryKey: ['/api/gemteam/turni/week-assignment', format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')],
  });
`;
const dipendentiFilterIdx = code.indexOf('const filteredSegreteria');
if (dipendentiFilterIdx > -1 && !code.includes('shiftMutation')) {
    code = code.substring(0, dipendentiFilterIdx) + mutationsCode + code.substring(dipendentiFilterIdx);
}

// FIX: imports
if (!code.includes('html2canvas')) {
    code = `import html2canvas from 'html2canvas';\nimport { jsPDF } from 'jspdf';\n` + code;
}
if (!code.includes('DropdownMenu')) {
    code = code.replace('import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";',
        'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";');
}

// --- FIX 6: OGGI ---
code = code.replace(
    /\{isSameDay\(turniDate, new Date\(\)\) &&\s*<Badge className="bg-emerald-500 hover:bg-emerald-600 text-\[10px\]">OGGI<\/Badge>\s*\}/,
    `{isSameDay(turniDate, new Date()) ? (
        <Badge onClick={() => setTurniDate(new Date())} className="bg-emerald-500 hover:bg-emerald-600 text-[10px] cursor-pointer">OGGI</Badge>
    ) : (
        <Badge onClick={() => setTurniDate(new Date())} variant="outline" className="text-emerald-600 border-emerald-500 hover:bg-emerald-50 text-[10px] cursor-pointer bg-white">OGGI</Badge>
    )}`
);

// --- FIX 5: A/B/C/D/E ---
const badgeSettimanaRegex = /<Badge variant="secondary" className="hidden sm:inline-flex.*?Sett\. 33 · Tipo A · 14-19 apr\s*<\/Badge>/s;
code = code.replace(badgeSettimanaRegex, `
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Badge variant="secondary" className="hidden sm:inline-flex ml-4 font-semibold text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer">
      Tipo {weekAssignment?.settimana || 'A'} · {format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'd MMM')} - {format(endOfWeek(turniDate, { weekStartsOn: 1 }), 'd MMM')}
    </Badge>
  </DropdownMenuTrigger>
  {isMaster && (
    <DropdownMenuContent>
      {['A', 'B', 'C', 'D', 'E'].map(l => (
        <DropdownMenuItem key={l} onClick={() => weekTypeMutation.mutate(l)}>Settimana Tipo {l}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  )}
</DropdownMenu>
`);

// --- FIX 8: SCARICA PDF ---
const scaricaPdfRegex = /onClick=\{\(\) => console\.log\('Scarica turni PDF'\)\}/;
code = code.replace(scaricaPdfRegex, `onClick={() => {
    const el = document.getElementById('griglia-turni');
    if (!el) return;
    html2canvas(el, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.setFontSize(16);
      pdf.text(\`GemTeam — Turni \${format(turniDate, "EEEE d MMMM yyyy", { locale: it })} — Tipo \${weekAssignment?.settimana || 'A'}\`, 10, 15);
      pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight - 20);
      pdf.save(\`turni_\${format(turniDate, 'yyyyMMdd')}_tipo\${weekAssignment?.settimana || 'A'}.pdf\`);
    });
}}`);

// Aggiungo id="griglia-turni" alla tabella
code = code.replace(/<table className="w-full border-collapse min-w-max bg-white table-fixed">/, '<table id="griglia-turni" className="w-full border-collapse min-w-max bg-white table-fixed">');

// --- FIX 4: NOMI COLONNE ---
// Sostituisco "dip.cognome {dip.nome..." con "dip.nome {dip.cognome..."
code = code.replace(/<span className="text-\[10px\] font-bold text-slate-700 uppercase truncate" title=\{dip\.cognome \+ ' ' \+ dip\.nome\}>\s*\{dip\.cognome\} \{dip\.nome \? dip\.nome\.charAt\(0\) : ''\}\.\s*<\/span>/g, 
    `<span className="text-[10px] font-bold text-slate-700 uppercase truncate" title={dip.nome + ' ' + dip.cognome}>
      {dip.nome} {dip.cognome ? dip.cognome.charAt(0) : ''}.
    </span>`);

// --- FIX 1 e FIX 2: POPOVERS ---
// Sostituisco <Select> block
const selectStubRegex = /<Select defaultValue=\{turniFiltrato\.postazione\}>[\s\S]*?<\/Select>/;
code = code.replace(selectStubRegex, `
<Select name="postazione" defaultValue={turniFiltrato.postazione}>
  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
  <SelectContent>
    {postazioniApi.filter((p:any) => p.attiva !== false).sort((a:any, b:any) => (a.ordine || 0) - (b.ordine || 0)).map((p:any) => (
      <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
    ))}
  </SelectContent>
</Select>
`);

const selectStubNewRegex = /<Select>[\s\S]*?<SelectTrigger><SelectValue placeholder="Seleziona\.\.\." \/><\/SelectTrigger>[\s\S]*?<SelectContent>[\s\S]*?<SelectItem value="RECEPTION">Reception<\/SelectItem>[\s\S]*?<SelectItem value="UFFICIO">Ufficio<\/SelectItem>[\s\S]*?<\/SelectContent>[\s\S]*?<\/Select>/;
code = code.replace(selectStubNewRegex, `
<Select name="postazione">
  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
  <SelectContent>
    {postazioniApi.filter((p:any) => p.attiva !== false).sort((a:any, b:any) => (a.ordine || 0) - (b.ordine || 0)).map((p:any) => (
      <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
    ))}
  </SelectContent>
</Select>
`);

// Add Name attributes to Inputs
code = code.replace(/<Input type="time" defaultValue=\{hour\} \/>/g, '<Input name="inizio" type="time" defaultValue={hour} />');
code = code.replace(/<Input type="time" defaultValue=\{\`\$\{hour\.substring\(0,2\)\}:30\`\} \/>/g, '<Input name="fine" type="time" defaultValue={\`\${hour.substring(0,2)}:30\`} />');
code = code.replace(/<Input placeholder="Opzionale\.\.\." \/>/g, '<Input name="note" placeholder="Opzionale..." />');
code = code.replace(/<Input defaultValue=\{turniFiltrato\.note\} placeholder="Opzionale\.\.\." \/>/g, '<Input name="note" defaultValue={turniFiltrato.note} placeholder="Opzionale..." />');

// Wrap with <form>
const popoverForm1 = `<form onSubmit={(e) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  shiftMutation.mutate({
    id: turniFiltrato.id,
    employeeId: dip.id,
    data: formattedTurniDate,
    oraInizio: formData.get('inizio'),
    oraFine: formData.get('fine'),
    postazione: formData.get('postazione'),
    note: formData.get('note')
  });
}}>`;

const contentUpdateStart = code.lastIndexOf('<PopoverContent className="w-72 p-4">', code.indexOf('<h4 className="font-bold text-sm mb-2">Modifica Turno</h4>'));
const buttonsUpdateEnd = code.indexOf('</PopoverContent>', contentUpdateStart);

if (contentUpdateStart > -1) {
    let block = code.substring(contentUpdateStart, buttonsUpdateEnd);
    block = block.replace('<div className="space-y-3">', popoverForm1 + '\n<div className="space-y-3">');
    block = block.replace('<Button size="sm">Salva</Button>', '<Button type="submit" size="sm" disabled={shiftMutation.isPending}>{shiftMutation.isPending ? "..." : "Salva"}</Button>');
    block = block.replace('<Button variant="destructive" size="sm">Elimina</Button>', '<Button type="button" variant="destructive" size="sm" onClick={() => deleteShiftMutation.mutate(turniFiltrato.id)}>Elimina</Button>');
    block = block.replace('</div>\n                                    </PopoverContent>', '</div>\n</form>'); // close form
    // The previous replace might fail if formatting is different. Let's do it safely.
    if (block.includes('</form>')) {} else {
       block = block.replace('</div>\n                                      </PopoverContent>', '</div>\n</form>\n                                      </PopoverContent>');
    }
    block += '</form>'; // force close just in case
    // wait I will replace exactly:
    let safeBlock = code.substring(contentUpdateStart, buttonsUpdateEnd);
    safeBlock = safeBlock.replace('<div className="space-y-3">', popoverForm1 + '\n<div className="space-y-3">');
    safeBlock = safeBlock.replace('<Button size="sm">Salva</Button>', '<Button type="submit" size="sm" disabled={shiftMutation.isPending}>{shiftMutation.isPending ? "..." : "Salva"}</Button>');
    safeBlock = safeBlock.replace('<Button variant="destructive" size="sm">Elimina</Button>', '<Button type="button" variant="destructive" size="sm" onClick={(e) => { e.preventDefault(); deleteShiftMutation.mutate(turniFiltrato.id);}}>Elimina</Button>');
    safeBlock = safeBlock.replace(/<div className="flex gap-2 justify-end mt-4">[\s\S]*?<\/div>/, (match) => match + '\n</form>');
    code = code.substring(0, contentUpdateStart) + safeBlock + code.substring(buttonsUpdateEnd);
}

const popoverForm2 = `<form onSubmit={(e) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  shiftMutation.mutate({
    employeeId: dip.id,
    data: formattedTurniDate,
    oraInizio: formData.get('inizio'),
    oraFine: formData.get('fine'),
    postazione: formData.get('postazione'),
    note: formData.get('note')
  });
}}>`;

const contentAddStart = code.lastIndexOf('<PopoverContent className="w-72 p-4">', code.indexOf('<h4 className="font-bold text-sm mb-2">Aggiungi Turno</h4>'));
const buttonsAddEnd = code.indexOf('</PopoverContent>', contentAddStart);

if (contentAddStart > -1) {
    let safeBlock2 = code.substring(contentAddStart, buttonsAddEnd);
    safeBlock2 = safeBlock2.replace('<div className="space-y-3">', popoverForm2 + '\n<div className="space-y-3">');
    safeBlock2 = safeBlock2.replace('<Button size="sm" className="w-full mt-4">Aggiungi</Button>', '<Button type="submit" size="sm" className="w-full mt-4" disabled={shiftMutation.isPending}>{shiftMutation.isPending ? "..." : "Aggiungi"}</Button>\n</form>');
    code = code.substring(0, contentAddStart) + safeBlock2 + code.substring(buttonsAddEnd);
}


// --- FIX 3: TOTALE ORE ---
const totRegex = /\{dip\.id === 1 \? '8\.0h' : '0\.0h'\}/;
code = code.replace(totRegex, `{(() => {
  const turniDip = Array.isArray(turniScheduled) ? turniScheduled.filter((t:any) => t.employeeId === dip.id) : [];
  if (turniDip.length === 0) return '0.0h';
  let mins = 0;
  turniDip.forEach((t:any) => {
    if (!t.oraInizio || !t.oraFine) return;
    const [hS, mS] = t.oraInizio.split(':').map(Number);
    const [hE, mE] = t.oraFine.split(':').map(Number);
    mins += (hE * 60 + mE) - (hS * 60 + mS);
  });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? \`\${h}.\${m/6}h\` : \`\${h}.0h\`;
})()}`);


// --- FIX 7: TAB DIPENDENTI - TEAM EDITABILE ---
// In the Sidebar of Dipendenti, there is "Ruolo Operativo" text.
const sidebarRepartoRegex = /<span className="font-semibold text-slate-700">\{selectedUserDip\.team\}<\/span>/;
code = code.replace(sidebarRepartoRegex, `
<div className="flex gap-2 w-48">
  <Select defaultValue={selectedUserDip.team} onValueChange={(val) => updateTeamMutation.mutate({ id: selectedUserDip.id, team: val })}>
    <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="segreteria">Segreteria</SelectItem>
      <SelectItem value="ass_manutenzione">Manutenzione</SelectItem>
      <SelectItem value="ufficio">Ufficio</SelectItem>
      <SelectItem value="amministrazione">Amministrazione</SelectItem>
      <SelectItem value="comunicazione">Comunicazione</SelectItem>
      <SelectItem value="direzione">Direzione</SelectItem>
      <SelectItem value="collaboratori">Collaboratori</SelectItem>
    </SelectContent>
  </Select>
</div>
`);



// --- FIX 9: POSTAZIONI SHEET ---
const postazioniSheetRegex = /<SheetHeader>\s*<SheetTitle>Gestione Postazioni \(In arrivo\)<\/SheetTitle>\s*<\/SheetHeader>/;
code = code.replace(postazioniSheetRegex, `
<SheetHeader>
  <SheetTitle>Gestione Postazioni</SheetTitle>
</SheetHeader>
<div className="mt-6 flex flex-col gap-4">
  <div className="bg-slate-100 rounded-md p-3">
    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Aggiungi nuova</div>
    <form className="flex gap-2" onSubmit={async (e: any) => { 
        e.preventDefault(); 
        await fetch('/api/gemteam/postazioni', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nome: e.target.nome.value, contaOre: true, attiva: true }) });
        queryClient.invalidateQueries({ queryKey: ['/api/gemteam/postazioni'] });
        e.target.reset();
    }}>
      <Input name="nome" placeholder="Es. RECEPTION" className="h-8 text-xs font-bold uppercase w-full" required />
      <Button size="sm" type="submit" className="h-8">Add</Button>
    </form>
  </div>
  <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
    {postazioniApi.map((p: any) => (
      <div key={p.id} className="flex items-center justify-between p-2 border rounded-md shadow-sm opacity-100 bg-white hover:border-blue-200">
        <span className="text-xs font-bold text-slate-800 uppercase">{p.nome}</span>
        <Button disabled variant="outline" size="sm" className="h-6 text-[10px]">Attiva</Button>
      </div>
    ))}
  </div>
</div>
`);

fs.writeFileSync(file, code);
console.log("REPLACEMENTS_DONE");
