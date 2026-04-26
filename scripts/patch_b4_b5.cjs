const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../client/src/components/CourseDuplicationWizard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add tableSourceSeasonId state
content = content.replace(
  'const [targetSeasonId, setTargetSeasonId] = useState<string>("");',
  'const [targetSeasonId, setTargetSeasonId] = useState<string>("");\n  const [tableSourceSeasonId, setTableSourceSeasonId] = useState<string>("");'
);

// 2. Modify effectiveSourceSeasonId to use state if present
content = content.replace(
  'const effectiveSourceSeasonId = currentSeasonId === "active" ? activeSeasonFallbackId : currentSeasonId;',
  'const initialSourceSeasonId = currentSeasonId === "active" ? activeSeasonFallbackId : currentSeasonId;\n  const effectiveSourceSeasonId = tableSourceSeasonId || initialSourceSeasonId;'
);

// 3. Fix targetSeasons (B5)
const targetSeasonsOld = `  const targetSeasons = useMemo(() => {
    if (!seasons || !seasons.length) return [];
    const sourceSeason = seasons.find(s => s.id.toString() === effectiveSourceSeasonId);
    if (!sourceSeason) return [];
    
    // Mostra solo le stagioni successive (con id o data inizio maggiore)
    return seasons.filter(s => {
       const isDifferent = s.id.toString() !== effectiveSourceSeasonId;
       const isSuccessive = new Date(s.startDate) > new Date(sourceSeason.startDate);
       return isDifferent && isSuccessive;
    });
  }, [seasons, effectiveSourceSeasonId]);`;

const targetSeasonsNew = `  const targetSeasons = useMemo(() => {
    if (!seasons || !seasons.length) return [];
    return seasons.filter(s => s.id.toString() !== effectiveSourceSeasonId);
  }, [seasons, effectiveSourceSeasonId]);`;

content = content.replace(targetSeasonsOld, targetSeasonsNew);

// 4. Add the Dropdown to the UI
const destDropdown = `<div className="space-y-1.5 w-[250px]">
                    <Label className="font-semibold text-slate-800">Stagione Destinazione</Label>
                    <Select value={targetSeasonId} onValueChange={setTargetSeasonId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Seleziona la stagione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {targetSeasons.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{getSeasonLabel(s, seasons)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>`;

const originDropdown = `<div className="space-y-1.5 w-[250px]">
                    <Label className="font-semibold text-slate-800">Stagione Origine</Label>
                    <Select value={effectiveSourceSeasonId} onValueChange={setTableSourceSeasonId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Seleziona la stagione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {seasons?.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{getSeasonLabel(s, seasons)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                ` + destDropdown;

content = content.replace(destDropdown, originDropdown);

fs.writeFileSync(file, content);
