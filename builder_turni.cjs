const fs = require('fs');
const path = './client/src/pages/gemteam.tsx';

let code = fs.readFileSync(path, 'utf8');

const imports = `import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { it } from "date-fns/locale";`;

const hoursGenerators = `
const HOURS: string[] = [];
for (let h = 7; h <= 23; h++) {
  HOURS.push(\`\${String(h).padStart(2,'0')}:00\`);
  HOURS.push(\`\${String(h).padStart(2,'0')}:30\`);
}
`;

const turniComponentCode = `
        <TabsContent value="turni" className="w-full relative">
          <div className="border-y border-slate-200 shadow-sm overflow-hidden bg-slate-50 w-full mb-8 flex flex-col">
            
            {/* SEZIONE A: HEADER */}
            <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTurniDate(subDays(turniDate, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-base sm:text-lg font-bold text-slate-800 tracking-tight min-w-[200px] text-center capitalize">
                      {format(turniDate, "EEEE d MMMM yyyy", { locale: it })}
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTurniDate(addDays(turniDate, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Badge variant="secondary" className="hidden sm:inline-flex ml-4 font-semibold text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer">
                      Sett. 33 · Tipo A · 14-19 apr
                    </Badge>
                    {isSameDay(turniDate, new Date()) && 
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">OGGI</Badge>
                    }
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200 overflow-x-auto">
                    <Button variant={turniViewMode === 'giornaliera' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-bold shadow-sm" onClick={() => setTurniViewMode('giornaliera')}>Giornaliera★</Button>
                    <Button variant={turniViewMode === 'settimanale' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-medium text-slate-500" onClick={() => setTurniViewMode('settimanale')}>Settimanale</Button>
                    <Button variant={turniViewMode === 'collettiva' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-medium text-slate-500" onClick={() => setTurniViewMode('collettiva')}>Collettiva</Button>
                    <Button variant={turniViewMode === 'singola' ? "default" : "ghost"} size="sm" className="h-7 text-xs font-medium text-slate-500" onClick={() => setTurniViewMode('singola')}>Singola</Button>
                  </div>
                  
                  {isMaster && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sheet open={isSheetOrderOpen} onOpenChange={setIsSheetOrderOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white">
                            <GripVertical className="h-3 w-3 mr-1 opacity-50" /> Ordina colonne
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Ordina colonne</SheetTitle>
                            <SheetDescription>Trascina i dipendenti per riordinare.</SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 max-h-[70vh] overflow-y-auto px-1">
                            {/* Drag context was requested to be kept stubbed if out of time, but F2-018 logic is already functioning for localOrder */}
                            Reimposta ordine
                          </div>
                        </SheetContent>
                      </Sheet>

                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        <Plus className="h-3 w-3 mr-1" /> Aggiungi turno
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => console.log('Scarica turni PDF')}>
                        <Download className="h-3 w-3 mr-1" /> Scarica turni
                      </Button>
                      
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-slate-600 border-slate-200 hover:bg-slate-50">
                            ⚙ Postazioni
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Gestione Postazioni (In arrivo)</SheetTitle>
                          </SheetHeader>
                        </SheetContent>
                      </Sheet>

                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SEZIONE B: BANNER EVENTI */}
            {eventiGiorno.length > 0 && (
              <div className="bg-amber-100/80 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
                {eventiGiorno.map((e: any) => (
                  <span key={e.id} className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <AlertTriangle className="h-3.5 w-3.5" /> {e.titolo}
                  </span>
                ))}
              </div>
            )}

            {/* SEZIONE C: GRIGLIA ORARIA GIORNALIERA */}
            <div className="flex-1 overflow-auto bg-slate-100/50 relative" style={{ maxHeight: '60vh' }}>
              <table className="w-full border-collapse min-w-max bg-white table-fixed">
                <thead className="sticky top-0 z-20 shadow-sm border-b border-slate-300">
                  {/* Raggruppamento Team */}
                  <tr>
                    <th className="w-20 min-w-20 bg-slate-50 border-r border-slate-300"></th>
                    <th colSpan={filteredSegreteria.length || 1} style={{backgroundColor: '#EAF3DE', color: '#3B6D11'}} className="border-r border-slate-300 py-1 text-center font-bold text-[10px] uppercase tracking-widest truncate">Segreteria</th>
                    <th colSpan={filteredManutenzione.length || 1} style={{backgroundColor: '#FAEEDA', color: '#633806'}} className="border-r border-slate-300 py-1 text-center font-bold text-[10px] uppercase tracking-widest truncate">Manutenzione</th>
                    <th colSpan={filteredUfficio.length || 1} style={{backgroundColor: '#E6F1FB', color: '#185FA5'}} className="border-r border-slate-300 py-1 text-center font-bold text-[10px] uppercase tracking-widest truncate">Ufficio</th>
                    <th colSpan={filteredAmministrazione.length || 1} style={{backgroundColor: '#E1F5EE', color: '#0F6E56'}} className="border-r border-slate-300 py-1 text-center font-bold text-[10px] uppercase tracking-widest truncate">Amministrazione</th>
                    <th colSpan={filteredComunicazione.length || 1} style={{backgroundColor: '#FAECE7', color: '#993C1D'}} className="border-r border-slate-300 py-1 text-center font-bold text-[10px] uppercase tracking-widest truncate">Comunicazione</th>
                    <th colSpan={filteredDirezione.length || 1} style={{backgroundColor: '#EEEDFE', color: '#3C3489'}} className="border-r border-slate-300 py-1 text-center font-bold text-[10px] uppercase tracking-widest truncate">Direzione</th>
                  </tr>

                  {/* Nomi Dipendenti */}
                  <tr>
                    <th className="bg-slate-100 border-r border-slate-300 text-[10px] text-slate-500 font-bold p-1 w-20">ORA</th>
                    {[...filteredSegreteria, ...filteredManutenzione, ...filteredUfficio, ...filteredAmministrazione, ...filteredComunicazione, ...filteredDirezione].map(dip => (
                      <th key={dip.id} className="bg-white border-r border-slate-200 p-1.5 w-28 group">
                         <div className="flex items-center justify-center gap-1">
                            {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />}
                            <span className="text-[10px] font-bold text-slate-700 uppercase truncate" title={dip.cognome + ' ' + dip.nome}>
                              {dip.cognome} {dip.nome ? dip.nome.charAt(0) : ''}.
                            </span>
                         </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100">
                  {HOURS.map(hour => (
                    <tr key={hour} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="bg-slate-50 border-r border-b border-slate-200 text-center text-[11px] font-semibold text-slate-600 p-1 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10 w-20 h-[22px]">
                        {hour}
                      </td>
                      {[...filteredSegreteria, ...filteredManutenzione, ...filteredUfficio, ...filteredAmministrazione, ...filteredComunicazione, ...filteredDirezione].map(dip => {
                         const turniFiltrato = Array.isArray(turniScheduled) ? turniScheduled.find((t:any) => t.employeeId === dip.id && t.oraInizio?.substring(0,5) === hour) : null;
                         const isAssente = turniFiltrato?.hasAbsence || false;
                         
                         return (
                           <td key={\`\${dip.id}-\${hour}\`} className={\`border-r border-b \${isAssente ? 'border-red-400 ring-2 ring-inset ring-red-500/30' : 'border-slate-200'} p-0.5 relative cursor-pointer min-h-[22px]\`}>
                              {turniFiltrato ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div title={isAssente ? "Assenza registrata" : ""} className={\`\${isAssente ? 'bg-red-100 text-red-800 border-red-300 opacity-70' : 'bg-indigo-100 text-indigo-800 border-indigo-200'} w-full h-full min-h-[20px] rounded border flex items-center justify-center p-0.5 shadow-sm hover:brightness-95\`}>
                                      <span className="text-[9px] font-bold uppercase truncate max-w-full">
                                        {isAssente && <AlertTriangle className="h-2 w-2 mr-0.5 inline pb-0.5"/>}
                                        {turniFiltrato.postazione}
                                      </span>
                                    </div>
                                  </PopoverTrigger>
                                  {isMaster && (
                                    <PopoverContent className="w-72 p-4">
                                      <h4 className="font-bold text-sm mb-2">Modifica Turno</h4>
                                      <p className="text-xs text-slate-500 mb-4">{dip.cognome} {dip.nome} - {hour}</p>
                                      
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-semibold text-slate-600">Postazione</label>
                                          <Select defaultValue={turniFiltrato.postazione}>
                                            <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                                            <SelectContent>
                                              {/* STUB per now, will be populated by postazioni API in the real query */}
                                              <SelectItem value="RECEPTION">Reception</SelectItem>
                                              <SelectItem value="UFFICIO">Ufficio</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex gap-2">
                                          <div className="w-1/2">
                                            <label className="text-xs font-semibold text-slate-600">Inizio</label>
                                            <Input type="time" defaultValue={hour} />
                                          </div>
                                          <div className="w-1/2">
                                            <label className="text-xs font-semibold text-slate-600">Fine</label>
                                            <Input type="time" defaultValue={\`\${hour.substring(0,2)}:30\`} />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs font-semibold text-slate-600">Note</label>
                                          <Input placeholder="Opzionale..." />
                                        </div>
                                      </div>

                                      <div className="flex gap-2 justify-end mt-4">
                                         <Button variant="destructive" size="sm">Elimina</Button>
                                         <Button size="sm">Salva</Button>
                                      </div>
                                    </PopoverContent>
                                  )}
                                </Popover>
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="w-full h-full min-h-[20px] bg-white text-transparent">_</div>
                                  </PopoverTrigger>
                                  {isMaster && (
                                    <PopoverContent className="w-72 p-4">
                                      <h4 className="font-bold text-sm mb-2">Aggiungi Turno</h4>
                                      <p className="text-xs text-slate-500 mb-4">{dip.cognome} {dip.nome} - {hour}</p>
                                      
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-semibold text-slate-600">Postazione</label>
                                          <Select>
                                            <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="RECEPTION">Reception</SelectItem>
                                              <SelectItem value="UFFICIO">Ufficio</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex gap-2">
                                          <div className="w-1/2">
                                            <label className="text-xs font-semibold text-slate-600">Inizio</label>
                                            <Input type="time" defaultValue={hour} />
                                          </div>
                                          <div className="w-1/2">
                                            <label className="text-xs font-semibold text-slate-600">Fine</label>
                                            <Input type="time" defaultValue={\`\${hour.substring(0,2)}:30\`} />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs font-semibold text-slate-600">Note</label>
                                          <Input placeholder="Opzionale..." />
                                        </div>
                                      </div>

                                      <Button size="sm" className="w-full mt-4">Aggiungi</Button>
                                    </PopoverContent>
                                  )}
                                </Popover>
                              )}
                           </td>
                         );
                      })}
                    </tr>
                  ))}
                </tbody>

                <tfoot className="sticky bottom-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] bg-white border-t-2 border-slate-300">
                  <tr>
                    <td className="bg-slate-100 border-r border-slate-300 text-center text-[10px] font-extrabold text-slate-600 p-2 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10 tracking-widest uppercase">
                      TOT ORE
                    </td>
                    {[...filteredSegreteria, ...filteredManutenzione, ...filteredUfficio, ...filteredAmministrazione, ...filteredComunicazione, ...filteredDirezione].map(dip => (
                      <td key={\`tot-\${dip.id}\`} className="text-center p-2 font-bold text-xs text-slate-600 border-r border-slate-200 bg-slate-50">
                        {/* Mock calculation: in final version we sum duration of postazioni with conta_ore=1 */}
                        {dip.id === 1 ? '8.0h' : '0.0h'}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
            
          </div>
        </TabsContent>
`;

let startIndex = code.indexOf('<TabsContent value="turni"');
let endIndex = code.indexOf('<TabsContent value="presenze"');

if (startIndex > -1 && endIndex > -1) {
    let before = code.substring(0, startIndex);
    
    // Inject the new hooks
    const injectHooks = `
  const [turniDate, setTurniDate] = useState(new Date());
  const formattedTurniDate = format(turniDate, 'yyyy-MM-dd');

  const { data: turniScheduled = [], refetch: refetchScheduled } = useQuery<any[]>({
    queryKey: ['/api/gemteam/turni/scheduled', formattedTurniDate],
  });

  const { data: eventiGiorno = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/turni/eventi-giorno', formattedTurniDate],
  });

  const { data: postazioniApi = [] } = useQuery<any[]>({
    queryKey: ['/api/gemteam/postazioni'],
  });

  const filteredSegreteria = dipendenti.filter(d => d.team === 'segreteria' && !isSystemEmployee(d));
  const filteredManutenzione = dipendenti.filter(d => (d.team === 'ass_manutenzione' || d.team === 'manutenzione') && !isSystemEmployee(d));
  const filteredUfficio = dipendenti.filter(d => d.team === 'ufficio' && !isSystemEmployee(d));
  const filteredAmministrazione = dipendenti.filter(d => d.team === 'amministrazione' && !isSystemEmployee(d));
  const filteredComunicazione = dipendenti.filter(d => d.team === 'comunicazione' && !isSystemEmployee(d));
  const filteredDirezione = dipendenti.filter(d => d.team === 'direzione' && !isSystemEmployee(d));
`;
    
    const insertHookIdx = before.lastIndexOf('const MOCK_EMPLOYEES');
    if(insertHookIdx !== -1) {
        before = before.substring(0, insertHookIdx) + injectHooks + "\n  " + before.substring(insertHookIdx);
    }
    
    let newCode = before + turniComponentCode + "\n        " + code.substring(endIndex);
    
    // Inject imports
    if(!newCode.includes('AlertTriangle')) {
        newCode = newCode.replace('GripVertical, AlertTriangle } from "lucide-react";', 'GripVertical } from "lucide-react";'); // reset
        newCode = newCode.replace('GripVertical } from "lucide-react";', 'GripVertical, AlertTriangle } from "lucide-react";');
    }
    
    // Replace HOURS logic completely just to be safe
    const hoursStart = newCode.indexOf('const HOURS: string[] = [];');
    const hoursEnd = newCode.indexOf('// Mock data');
    if (hoursStart > -1 && hoursEnd > -1) {
        newCode = newCode.substring(0, hoursStart) + hoursGenerators + "\n" + newCode.substring(hoursEnd);
    }

    fs.writeFileSync(path, newCode);
    console.log('SUCCESS');
} else {
    console.log('FAILED STRING MATCH');
}
