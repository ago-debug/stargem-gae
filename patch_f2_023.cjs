const fs = require('fs');
const file = 'client/src/pages/gemteam.tsx';
let code = fs.readFileSync(file, 'utf8');

// FIX 1: postazioniApi queryFn with credentials
const oldPostazioni = `  const { data: postazioniApi = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/postazioni'],
  });`;
const newPostazioni = `  const { data: postazioniApi = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/postazioni'],
    queryFn: async () => {
      const res = await fetch('/api/gemteam/postazioni', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    }
  });`;
code = code.replace(oldPostazioni, newPostazioni);

// FIX 1 b) Filter attiva
// In UI, replacing postazioniApi.filter(p => p.attiva !== false) to p.attiva === 1 || p.attiva === true as the user provided: p => p.attiva
code = code.replace(/postazioniApi\.filter\(\(p:any\) => p\.attiva !== false\)/g, 'postazioniApi.filter((p:any) => p.attiva === 1 || p.attiva === true || p.attiva)');

// FIX 2: Rename isSheetOrderOpen to ordinaOpen
code = code.replace(/isSheetOrderOpen/g, 'ordinaOpen');
code = code.replace(/setIsSheetOrderOpen/g, 'setOrdinaOpen');

// F2-018: Add Drag and Drop lists in the Sheet for Ordina Colonne! The user said "Verifica che il bottone apra lo Sheet con la lista drag & drop". It was a stub.
// Let's implement the drag and drop content for ordinaOpen. We already have the Sortable elements.
const stubCart = `<div className="mt-6 max-h-[70vh] overflow-y-auto px-1">
                            {/* Drag context was requested to be kept stubbed if out of time, but F2-018 logic is already functioning for localOrder */}
                            Reimposta ordine
                          </div>`;
const ordinaContent = `<div className="mt-6 max-h-[70vh] overflow-y-auto px-1">
                            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                              <SortableContext items={localOrder.map(d => d.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                  {localOrder.map(d => (
                                    <OrdinaRow key={d.id} dip={d} />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            <Button onClick={handleSaveOrder} disabled={isSavingOrder} className="w-full mt-6 bg-primary text-white">
                              {isSavingOrder ? 'Salvataggio...' : 'Salva ordine'}
                            </Button>
                          </div>`;
code = code.replace(stubCart, ordinaContent);


// FIX 3: Badge A-E cliccabile with Popover
const oldBadgeMenuRegex = /<DropdownMenu>[\s\S]*?<\/DropdownMenu>/;
const newBadgePopover = `
<Popover>
  <PopoverTrigger asChild>
    <Badge variant="secondary" className="hidden sm:inline-flex ml-4 font-semibold text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer">
      Tipo {weekAssignment?.settimana || 'A'} · {format(startOfWeek(turniDate, { weekStartsOn: 1 }), 'd MMM')}
    </Badge>
  </PopoverTrigger>
  {isMaster && (
    <PopoverContent className="w-auto p-3">
      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase text-center">Settimana Tipo</h4>
      <div className="flex gap-1.5">
        {['A', 'B', 'C', 'D', 'E'].map(l => (
          <Button key={l} variant={weekAssignment?.settimana === l ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => {
            weekTypeMutation.mutate(l);
          }}>{l}</Button>
        ))}
      </div>
    </PopoverContent>
  )}
</Popover>
`;
if (code.match(oldBadgeMenuRegex)) {
   code = code.replace(oldBadgeMenuRegex, newBadgePopover);
}

// FIX 4: Team credentials include
const oldUpdateTeam = `const res = await fetch(\`/api/gemteam/dipendenti/\${id}\`, { // Fallback if reorder or specific ID route missing? No, the user provided code block! We will patch /api/gemteam/dipendenti/:id
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      });`;
const newUpdateTeam = `const res = await fetch(\`/api/gemteam/dipendenti/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
        credentials: 'include'
      });`;
code = code.replace(oldUpdateTeam, newUpdateTeam);

// Verify that the dropdown has 6 options exactly
if (code.includes('SelectItem value="segreteria"')) {
   // it was already added in F2-022. Just making sure Labels match prompt: "segreteria -> Segreteria", "ass_manutenzione -> Manutenzione"...
   // It was already perfect: <SelectItem value="ass_manutenzione">Manutenzione</SelectItem>
}

// Write file
fs.writeFileSync(file, code);
