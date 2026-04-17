const fs = require('fs');
let content = fs.readFileSync('client/src/pages/gemteam.tsx', 'utf8');

// The file might already have some of my changes from the first successful chunk apply. Let's revert it.
// Oh wait, I checked out the file, so it is exactly at the state of the commit!
// Let's perform replacements safely.

// Root container
content = content.replace(
  '<div className="p-6 md:p-8 space-y-8 w-full max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">',
  '<div className="py-6 md:py-8 space-y-8 w-full animate-in fade-in zoom-in-95 duration-500">'
);

// Header
content = content.replace(
  '{/* HEADER */}\n      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-4">',
  '{/* HEADER */}\n      <div className="px-6 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 gap-4">'
);

// TabsList
content = content.replace(
  '<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">\n        <TabsList className="grid w-full grid-flow-auto grid-cols-3 md:grid-cols-6 h-auto p-1.5 gap-1.5 bg-slate-100 rounded-xl mb-8">',
  '<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">\n        <div className="px-6 md:px-8 max-w-7xl mx-auto w-full">\n        <TabsList className="grid w-full grid-flow-auto grid-cols-3 md:grid-cols-6 h-auto p-1.5 gap-1.5 bg-slate-100 rounded-xl mb-8">'
);
content = content.replace(
  '<PieChart className="w-4 h-4 mr-2" /> Report\n          </TabsTrigger>\n        </TabsList>\n\n        <TabsContent value="dashboard">',
  '<PieChart className="w-4 h-4 mr-2" /> Report\n          </TabsTrigger>\n        </TabsList>\n        </div>\n\n        <TabsContent value="dashboard">'
);

// Tab Dashboard
content = content.replace(
  '<TabsContent value="dashboard">\n          <div className="space-y-6">',
  '<TabsContent value="dashboard">\n          <div className="px-6 md:px-8 max-w-7xl mx-auto space-y-6">'
);
content = content.replace(
  '          </div>\n        </TabsContent>\n\n        <TabsContent value="dipendenti">',
  '          </div>\n          </div>\n        </TabsContent>\n\n        <TabsContent value="dipendenti">'
);

// Tab Dipendenti
content = content.replace(
  '<TabsContent value="dipendenti">\n          <div className="space-y-6">',
  '<TabsContent value="dipendenti">\n          <div className="px-6 md:px-8 max-w-7xl mx-auto space-y-6">'
);
content = content.replace(
  '              </SheetContent>\n            </Sheet>\n          </div>\n        </TabsContent>\n\n        <TabsContent value="turni">',
  '              </SheetContent>\n            </Sheet>\n          </div>\n          </div>\n        </TabsContent>\n\n        <TabsContent value="turni" className="w-full">'
);

// Tab turni: filter id 15 & 16, remove limits
content = content.replace(
  '<Card className="border-slate-200 shadow-sm overflow-hidden">\n            <CardContent className="p-0 sm:p-6 space-y-6 bg-slate-50">',
  '<div className="border-y border-slate-200 shadow-sm overflow-hidden bg-slate-50">\n            <div className="p-0 sm:p-2 space-y-6">'
);
content = content.replace(
  '<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-transparent lg:border-slate-200 pb-0 lg:pb-4 p-4 lg:p-0">',
  '<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-transparent lg:border-slate-200 pb-0 lg:pb-4 p-4 md:px-6">'
);
// replace dipendenti.map with dipendenti.filter... in 2 places inside TabsContent turni
content = content.replace(
  ' dipendenti.map(dip => (\n                        <th key={dip.id}',
  ' dipendenti.filter(d => d.id !== 15 && d.id !== 16).map(dip => (\n                        <th key={dip.id}'
);
content = content.replace(
  ' dipendenti.map(dip => {\n                          const turniFound',
  ' dipendenti.filter(d => d.id !== 15 && d.id !== 16).map(dip => {\n                          const turniFound'
);

// Legenda rapida padding
content = content.replace(
  '<div className="flex flex-wrap gap-1.5 pt-2 px-4 pb-4 sm:p-0">\n                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mr-2">Legenda Postazioni</span>',
  '<div className="flex flex-wrap gap-1.5 pt-2 px-4 pb-4 md:px-6">\n                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mr-2">Legenda Postazioni</span>'
);

content = content.replace(
  '            </CardContent>\n          </Card>\n\n          {/* SEPARATORE */}\n          <div className="my-8 border-t border-slate-200" />\n\n          {/* CALENDARIO REALE */}\n          <Card className="border-slate-200 shadow-sm overflow-hidden">\n            <CardContent className="p-4 sm:p-6 space-y-6 bg-slate-50">',
  '            </div>\n          </div>\n\n          {/* SEPARATORE */}\n          <div className="my-8 border-t border-slate-200" />\n\n          {/* CALENDARIO REALE */}\n          <div className="px-6 md:px-8 max-w-7xl mx-auto py-8">\n          <Card className="border-slate-200 shadow-sm overflow-hidden">\n            <CardContent className="p-4 sm:p-6 space-y-6 bg-slate-50">'
);

content = content.replace(
  '            </CardContent>\n          </Card>\n        </TabsContent>\n\n        <TabsContent value="presenze">',
  '            </CardContent>\n          </Card>\n          </div>\n        </TabsContent>\n\n        <TabsContent value="presenze">'
);

// Tab Presenze
content = content.replace(
  '<TabsContent value="presenze">\n          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">',
  '<TabsContent value="presenze">\n          <div className="px-6 md:px-8 max-w-7xl mx-auto">\n          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">'
);
content = content.replace(
  '            </CardContent>\n          </Card>\n        </TabsContent>\n\n        <TabsContent value="diario">',
  '            </CardContent>\n          </Card>\n          </div>\n        </TabsContent>\n\n        <TabsContent value="diario">'
);

// Tab Diario
content = content.replace(
  '<TabsContent value="diario">\n          <Card className="border-slate-200 shadow-sm overflow-hidden bg-slate-50">',
  '<TabsContent value="diario">\n          <div className="px-6 md:px-8 max-w-7xl mx-auto space-y-6">\n          <Card className="border-slate-200 shadow-sm overflow-hidden bg-slate-50">'
);
content = content.replace(
  '                </table>\n              </div>\n              \n            </CardContent>\n          </Card>\n        </TabsContent>\n\n        <TabsContent value="report">',
  '                </table>\n              </div>\n              \n            </CardContent>\n          </Card>\n          </div>\n        </TabsContent>\n\n        <TabsContent value="report">'
);

// Tab Report
content = content.replace(
  '<TabsContent value="report">\n          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">',
  '<TabsContent value="report">\n          <div className="px-6 md:px-8 max-w-7xl mx-auto">\n          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">'
);
content = content.replace(
  '            </CardContent>\n          </Card>\n        </TabsContent>\n      </Tabs>\n    </div>',
  '            </CardContent>\n          </Card>\n          </div>\n        </TabsContent>\n      </Tabs>\n    </div>'
);

fs.writeFileSync('client/src/pages/gemteam.tsx', content);
