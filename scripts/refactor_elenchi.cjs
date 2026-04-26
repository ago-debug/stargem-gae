const fs = require('fs');
const path = require('path');

const elenchiPath = path.join(__dirname, '../client/src/pages/elenchi.tsx');
const lines = fs.readFileSync(elenchiPath, 'utf8').split('\n');

// 1. We keep everything up to the definition of SimpleListsManager (around line 681)
const simpleListsManagerIndex = lines.findIndex(l => l.startsWith('function SimpleListsManager'));
let newContent = lines.slice(0, simpleListsManagerIndex).join('\n');

// 2. We inject the maps
const maps = `
const AREA_MAP: Record<string, { label: string, lists: string[] }> = {
  corsi: { label: '🎓 Corsi', lists: ['stato_corso','tag_interni','categorie'] },
  iscrizioni: { label: '📝 Iscrizioni', lists: ['tipo_partecipante','stato','dettaglio_iscrizione'] },
  pagamenti: { label: '💳 Pagamenti', lists: ['metodi_pagamento','note_pagamento','tipi_carnet'] },
  anagrafica: { label: '👤 Anagrafica', lists: ['categorie_anagrafica','canale_acquisizione','tessera_ente'] },
  altro: { label: '⚙️ Altro', lists: ['categorie_affitti','categorie_booking','categorie_merchandising','campus'] }
};

const USED_IN_MAP: Record<string, string[]> = {
  stato_corso: ['Modifica Corso','Calendario Attività'],
  tag_interni: ['Modifica Corso (solo staff)'],
  categorie: ['Corsi','Filtri Calendario'],
  tipo_partecipante: ['Iscrizioni','Anagrafica'],
  stato: ['Iscrizioni','Maschera Input'],
  dettaglio_iscrizione: ['Iscrizioni'],
  metodi_pagamento: ['Pagamenti','Maschera Input'],
  note_pagamento: ['Pagamenti'],
  tipi_carnet: ['Quote e Promo'],
  categorie_anagrafica: ['Anagrafica'],
  canale_acquisizione: ['Anagrafica'],
  tessera_ente: ['GemPass'],
  categorie_affitti: ['Affitti'],
  categorie_booking: ['Prenotazioni'],
  categorie_merchandising: ['Merchandising'],
  campus: ['Campus'],
};

// Check if a list should show colors based on the rules
function isColoredList(systemCode: string): boolean {
  return systemCode.includes('stato') || systemCode.includes('tipo') || systemCode.includes('metod') || systemCode.includes('tag');
}
`;

// 3. We create the main Elenchi component
const newMainComponent = `
export default function Elenchi() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialArea = searchParams.get('area') || 'corsi';
  const [activeArea, setActiveArea] = useState(initialArea);

  useEffect(() => {
    const area = searchParams.get('area');
    if (area && AREA_MAP[area]) {
      setActiveArea(area);
    }
  }, [location]);

  const { data: lists, isLoading } = useQuery<(CustomList & { items: CustomListItem[] })[]>({
    queryKey: ["/api/custom-lists"],
  });

  const handleAreaChange = (area: string) => {
    setActiveArea(area);
    setLocation(\`/elenchi?area=\${area}\`, { replace: true });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Caricamento elenchi...</div>;
  }

  const activeLists = AREA_MAP[activeArea].lists;

  return (
    <div className="p-6 md:p-8 space-y-8 mx-auto max-w-[1400px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg icon-gold-bg flex items-center justify-center shadow-sm">
          <ListChecks className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Gestione Elenchi</h1>
          <p className="text-sm text-muted-foreground">Configura le voci a tendina per le varie aree del gestionale.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Navigazione Aree */}
        <div className="w-full md:w-1/4 flex flex-col gap-2 shrink-0 bg-white p-3 rounded-xl border border-border shadow-sm">
          {Object.entries(AREA_MAP).map(([key, area]) => {
            const isActive = activeArea === key;
            return (
              <button
                key={key}
                onClick={() => handleAreaChange(key)}
                className={\`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors \${
                  isActive 
                    ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }\`}
              >
                <span>{area.label}</span>
                <span className={\`text-xs px-2 py-0.5 rounded-full \${isActive ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}\`}>
                  {area.lists.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenuto Area (Accordion delle liste) */}
        <div className="w-full md:w-3/4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-border">
              {AREA_MAP[activeArea].label}
            </h2>
            
            <div className="space-y-4">
              {activeLists.map(listCode => {
                const listData = lists?.find(l => l.systemName === listCode || l.systemCode === listCode);
                if (!listData) {
                  return (
                    <Card key={listCode} className="border-dashed bg-slate-50/50">
                      <CardContent className="p-4 flex flex-col gap-1">
                         <span className="font-semibold text-slate-700">{listCode}</span>
                         <span className="text-xs text-red-500">Manca nel DB. Crearla via API o DB prima di usarla.</span>
                      </CardContent>
                    </Card>
                  );
                }

                const usedIn = USED_IN_MAP[listCode] || [];

                return (
                  <div key={listCode} className="relative">
                     <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal">
                          Usato in: {usedIn.join(', ')}
                        </Badge>
                     </div>
                     <SimpleListSection list={listData} showColors={isColoredList(listCode)} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// Wait, the SimpleListSection signature only takes `list`, we need to change it to accept `showColors` OR we can just inject `showColors` inside the component definition.
// Let's modify `SimpleListSection` in `newContent`!
newContent = newContent.replace('function SimpleListSection({ list }: SimpleListSectionProps) {', 'function SimpleListSection({ list, showColors }: SimpleListSectionProps & { showColors?: boolean }) {');

// Inside SimpleListSection, we must hide the color picker if `!showColors`.
newContent = newContent.replace(
  '<input\n                    type="color"',
  '{showColors !== false && <input\n                    type="color"'
);
newContent = newContent.replace(
  'title="Scegli colore categoria"\n                  />',
  'title="Scegli colore categoria"\n                  />}'
);

newContent = newContent.replace(
  '{item.color && (',
  '{showColors !== false && item.color && ('
);

// We need to write this to the file
fs.writeFileSync(elenchiPath, newContent + '\n' + maps + '\n' + newMainComponent);

console.log("File elenchi.tsx rewritten successfully!");
