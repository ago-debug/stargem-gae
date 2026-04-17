const fs = require('fs');

const path = './client/src/pages/gemteam.tsx';
let code = fs.readFileSync(path, 'utf8');

// The new Turni Content
const turniBlock = `
        <TabsContent value="turni" className="w-full relative">
          <div className="border-y border-slate-200 shadow-sm overflow-hidden bg-slate-50 w-full mb-8 flex flex-col">
            
            {/* SEZIONE A: HEADER */}
            <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="text-lg font-bold text-slate-800 tracking-tight">Venerdi 17 aprile 2026</div>
                    <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                    
                    <Badge variant="secondary" className="ml-4 font-semibold text-xs border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer">
                      Sett. 33 · Tipo A · 14-19 apr
                    </Badge>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px]">OGGI</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
                    <Button variant="default" size="sm" className="h-7 text-xs font-bold shadow-sm">Giornaliera★</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-medium text-slate-500">Settimanale</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-medium text-slate-500">Collettiva</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-medium text-slate-500">Singola</Button>
                  </div>
                  
                  {isMaster && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white">
                        <GripVertical className="h-3 w-3 mr-1 opacity-50" /> Ordina colonne
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        <Plus className="h-3 w-3 mr-1" /> Aggiungi turno
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                        <Download className="h-3 w-3 mr-1" /> Scarica turni
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SEZIONE B: BANNER EVENTI CONDIZIONALE STUB */}
            <div className="bg-amber-100/80 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
              <span className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5" /> Chiusura Estiva · VACANZE
              </span>
            </div>

            {/* SEZIONE C: GRIGLIA ORARIA GIORNALIERA */}
            <div className="flex-1 overflow-auto bg-slate-100/50 relative" style={{ maxHeight: '60vh' }}>
              <table className="w-full border-collapse min-w-max bg-white table-fixed">
                <thead className="sticky top-0 z-20 shadow-sm">
                  {/* Raggruppamento Team */}
                  <tr>
                    <th className="w-20 min-w-20 bg-slate-50 border-r border-b border-slate-300"></th>
                    
                    {/* Esempi statici in attesa del map dinamico: segreteria e uffici */}
                    <th colSpan={3} className="bg-green-100 border-r border-b border-green-200 py-1 text-center font-bold text-[10px] text-green-800 uppercase tracking-widest shadow-sm">
                      Segreteria
                    </th>
                    <th colSpan={2} className="bg-blue-100 border-r border-b border-blue-200 py-1 text-center font-bold text-[10px] text-blue-800 uppercase tracking-widest shadow-sm">
                      Ufficio
                    </th>
                  </tr>

                  {/* Nomi Dipendenti */}
                  <tr>
                    <th className="bg-slate-100 border-r border-b border-slate-300 text-[10px] text-slate-500 font-bold p-1 w-20">ORA</th>
                    <th className="bg-white border-r border-b border-slate-200 p-1.5 w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab" />}
                        <span className="text-[10px] font-bold text-slate-700 uppercase truncate">MALDONADO A.</span>
                      </div>
                    </th>
                    <th className="bg-white border-r border-b border-slate-200 p-1.5 w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab" />}
                        <span className="text-[10px] font-bold text-slate-700 uppercase truncate">FUMAGALLI G.</span>
                      </div>
                    </th>
                    <th className="bg-white border-r border-b border-slate-200 p-1.5 w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab" />}
                        <span className="text-[10px] font-bold text-slate-700 uppercase truncate">SEGURA E.</span>
                      </div>
                    </th>
                    <th className="bg-white border-r border-b border-slate-200 p-1.5 w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab" />}
                        <span className="text-[10px] font-bold text-slate-700 uppercase truncate">JANNELLI S.</span>
                      </div>
                    </th>
                    <th className="bg-white border-r border-b border-slate-200 p-1.5 w-24">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMaster && <GripVertical className="h-3 w-3 text-slate-300 cursor-grab" />}
                        <span className="text-[10px] font-bold text-slate-700 uppercase truncate">NEMBRI M.</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100">
                  {/* Riga oraria statica mock 08:00 */}
                  <tr className="group">
                    <td className="bg-slate-50 border-r border-slate-200 text-center text-xs font-semibold text-slate-600 p-1 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10 w-20">08:00</td>
                    
                    {/* Cella Turno Assente/Vuota */}
                    <td className="border-r border-slate-200 p-0.5 h-[28px] relative hover:bg-slate-50 transition-colors cursor-pointer group-hover:bg-slate-50/50">
                      
                    </td>
                    
                    {/* Cella Turno Presente */}
                    <td className="border-r border-slate-200 p-0.5 h-[28px] relative hover:bg-slate-50 transition-colors cursor-pointer group-hover:bg-slate-50/50">
                      <div className="bg-indigo-100 text-indigo-700 w-full h-full rounded border border-indigo-200 flex items-center justify-center shadow-sm">
                        <span className="text-[9px] font-bold uppercase truncate">Front Desk</span>
                      </div>
                    </td>

                    {/* Cella Conflitto (Assenza) */}
                    <td className="border-r border-red-400 p-0.5 h-[28px] relative hover:bg-red-50 transition-colors cursor-pointer ring-2 ring-inset ring-red-500/30">
                      <div className="bg-red-100 text-red-800 w-full h-full rounded border border-red-300 flex items-center justify-between px-1 shadow-sm opacity-60">
                        <span className="text-[9px] font-bold uppercase truncate">Ammin</span>
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      </div>
                    </td>
                    
                    <td className="border-r border-slate-200 p-0.5 h-[28px]"></td>
                    <td className="border-r border-slate-200 p-0.5 h-[28px]"></td>
                  </tr>

                  {/* Riga oraria statica mock 08:30 */}
                  <tr className="group">
                    <td className="bg-slate-50 border-r border-slate-200 text-center text-xs font-semibold text-slate-600 p-1 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10">08:30</td>
                    <td className="border-r border-slate-200 p-0.5 h-[28px]"></td>
                    <td className="border-r border-slate-200 p-0.5 h-[28px]">
                      <div className="bg-indigo-100 text-indigo-700 w-full h-full rounded border border-indigo-200 flex items-center justify-center shadow-sm">
                        <span className="text-[9px] font-bold uppercase truncate">Front Desk</span>
                      </div>
                    </td>
                    <td className="border-r border-slate-200 p-0.5 h-[28px]"></td>
                    <td className="border-r border-slate-200 p-0.5 h-[28px]"></td>
                    <td className="border-r border-slate-200 p-0.5 h-[28px]"></td>
                  </tr>
                </tbody>

                {/* RIGA TOTALE ORE */}
                <tfoot className="sticky bottom-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] bg-white border-t-2 border-slate-300">
                  <tr>
                    <td className="bg-slate-100 border-r border-slate-300 text-center text-[10px] font-extrabold text-slate-600 p-2 select-none sticky left-0 shadow-[1px_0_0_rgba(200,200,200,0.5)] z-10 tracking-widest uppercase">
                      TOT ORE
                    </td>
                    <td className="text-center p-2 font-bold text-xs text-slate-600 border-r border-slate-200 bg-slate-50">0.0h</td>
                    <td className="text-center p-2 font-bold text-xs text-slate-600 border-r border-slate-200 bg-slate-50">8.0h</td>
                    <td className="text-center p-2 font-bold text-xs text-red-600 border-r border-slate-200 bg-red-50">Assente</td>
                    <td className="text-center p-2 font-bold text-xs text-slate-600 border-r border-slate-200 bg-slate-50">0.0h</td>
                    <td className="text-center p-2 font-bold text-xs text-slate-600 border-r border-slate-200 bg-slate-50">0.0h</td>
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
  let newCode = code.substring(0, startIndex) + turniBlock + "\n        " + code.substring(endIndex);
  // Add missing imports
  if (!newCode.includes('AlertTriangle')) {
    newCode = newCode.replace('GripVertical } from "lucide-react";', 'GripVertical, AlertTriangle } from "lucide-react";');
  }
  fs.writeFileSync(path, newCode);
  console.log("SUCCESS REPLACE");
} else {
  console.log("FAILED STRINGS NOT FOUND");
}
