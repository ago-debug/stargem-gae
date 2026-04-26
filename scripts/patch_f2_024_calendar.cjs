const fs = require('fs');
const path = require('path');

let file = path.join(__dirname, '../client/src/pages/calendar.tsx');
let content = fs.readFileSync(file, 'utf8');

// =======================
// FIX 10b: activityStatuses
// =======================
const oldStatusQuery = `    const { data: activityStatuses } = useQuery<ActivityStatus[]>({
        queryKey: ["/api/activity-statuses"],
    });`;

const newStatusQuery = `    const { data: activityStatusesResponse } = useQuery<any>({
        queryKey: ["/api/custom-lists/stato_corso"],
    });
    const activityStatuses = activityStatusesResponse?.items?.map((item: any) => ({
        name: item.value,
        color: item.color
    })) || [];`;

content = content.replace(oldStatusQuery, newStatusQuery);

// =======================
// FIX 10a: Layout
// =======================
const oldLayout = `                                                            <div className="flex w-full items-center justify-between mt-1 gap-1">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {(() => {
                                                                        let remainingOccurrences = evt.rawPayload?.totalOccurrences || null;
                                                                        if (remainingOccurrences && evt.rawPayload?.endDate && evt.dayOfWeek) {
                                                                            const isDayCol = selectedDay === 'all';
                                                                            const colId = col.id;
                                                                            const targetDateStr = isDayCol ? weekDatesMap[colId] : weekDatesMap[selectedDay];
                                                                            if (targetDateStr) {
                                                                                const end = evt.rawPayload.endDate?.split('T')[0];
                                                                                const dayMap: Record<string,number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
                                                                                const target = dayMap[normalizeDay(evt.dayOfWeek)];
                                                                                let count = 0;
                                                                                const d = new Date(targetDateStr);
                                                                                const endDate = new Date(end);
                                                                                while (d <= endDate) {
                                                                                    if (d.getDay() === target) {
                                                                                        const ds = d.toISOString().split('T')[0];
                                                                                        if (!closedDaysMap[ds]) count++;
                                                                                    }
                                                                                    d.setDate(d.getDate() + 1);
                                                                                }
                                                                                remainingOccurrences = count;
                                                                            }
                                                                        }
                                                                        
                                                                        return remainingOccurrences && remainingOccurrences > 0 ? (
                                                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                                                                {remainingOccurrences} Lez
                                                                            </span>
                                                                        ) : null;
                                                                    })()}
                                                                    <div className="flex flex-wrap gap-1" title={statusLabels.join(", ")}>
                                                                        {statusLabels.map(s => {
                                                                        const color = getStatusColor(s, activityStatuses);
                                                                        return (
                                                                            <div key={s} className="text-[8px] font-bold uppercase tracking-wider leading-none truncate px-1 py-[1.5px] rounded-[2px]" style={color ? { backgroundColor: \`\${color}15\`, color, border: \`0.5px solid \${color}40\` } : { color: s === "ATTIVO" ? "#15803d" : "#b91c1c" }}>
                                                                                {s}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {internalLabels.length > 0 && internalLabels.map(tag => (
                                                                      <span key={tag}
                                                                        className="text-[9px] font-bold uppercase px-1 py-[1px]
                                                                          rounded-[2px] bg-indigo-100 text-indigo-700 
                                                                          border border-indigo-200 leading-none truncate">
                                                                        {tag}
                                                                      </span>
                                                                    ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    {(evt.sourceType === "course" || evt.sourceType === "courses") && (
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateSingle(evt.rawPayload as any); }} className="bg-white/60 p-0.5 px-1 rounded hover:bg-white text-indigo-600 transition-colors shadow-sm border border-black/5" title="Duplica Corso">
                                                                            <Copy className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    )}
                                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(e as any); }} className="bg-white/60 p-0.5 px-1 rounded hover:bg-white text-slate-800 transition-colors shadow-sm border border-black/5" title="Modifica rapida">
                                                                        <Edit2 className="w-2.5 h-2.5" />
                                                                    </button>
                                                                </div>
                                                            </div>`;

const newLayout = `                                                            <div className="flex flex-col w-full mt-1 gap-1">
                                                                <div className="flex w-full items-center justify-between">
                                                                    {(() => {
                                                                        let remainingOccurrences = evt.rawPayload?.totalOccurrences || null;
                                                                        if (remainingOccurrences && evt.rawPayload?.endDate && evt.dayOfWeek) {
                                                                            const isDayCol = selectedDay === 'all';
                                                                            const colId = col.id;
                                                                            const targetDateStr = isDayCol ? weekDatesMap[colId] : weekDatesMap[selectedDay];
                                                                            if (targetDateStr) {
                                                                                const end = evt.rawPayload.endDate?.split('T')[0];
                                                                                const dayMap: Record<string,number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
                                                                                const target = dayMap[normalizeDay(evt.dayOfWeek)];
                                                                                let count = 0;
                                                                                const d = new Date(targetDateStr);
                                                                                const endDate = new Date(end);
                                                                                while (d <= endDate) {
                                                                                    if (d.getDay() === target) {
                                                                                        const ds = d.toISOString().split('T')[0];
                                                                                        if (!closedDaysMap[ds]) count++;
                                                                                    }
                                                                                    d.setDate(d.getDate() + 1);
                                                                                }
                                                                                remainingOccurrences = count;
                                                                            }
                                                                        }
                                                                        
                                                                        return remainingOccurrences && remainingOccurrences > 0 ? (
                                                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                                                                {remainingOccurrences} Lez
                                                                            </span>
                                                                        ) : <span className="w-4"></span>;
                                                                    })()}
                                                                    <div className="flex gap-1 shrink-0">
                                                                        {(evt.sourceType === "course" || evt.sourceType === "courses") && (
                                                                            <button onClick={(e) => { e.stopPropagation(); handleDuplicateSingle(evt.rawPayload as any); }} className="bg-white/60 p-0.5 px-1 rounded hover:bg-white text-indigo-600 transition-colors shadow-sm border border-black/5" title="Duplica Corso">
                                                                                <Copy className="w-2.5 h-2.5" />
                                                                            </button>
                                                                        )}
                                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(e as any); }} className="bg-white/60 p-0.5 px-1 rounded hover:bg-white text-slate-800 transition-colors shadow-sm border border-black/5" title="Modifica rapida">
                                                                            <Edit2 className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                                    {statusLabels.map(s => {
                                                                        const color = getStatusColor(s, activityStatuses);
                                                                        return (
                                                                            <div key={s} className="text-[8px] font-bold uppercase tracking-wider leading-none truncate px-1 py-[1.5px] rounded-[2px]" style={color ? { backgroundColor: \`\${color}15\`, color, border: \`0.5px solid \${color}40\` } : { color: s === "ATTIVO" ? "#15803d" : "#b91c1c" }}>
                                                                                {s}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {internalLabels.length > 0 && internalLabels.map(tag => (
                                                                      <span key={tag}
                                                                        className="text-[9px] font-bold uppercase px-1 py-[1px]
                                                                          rounded-[2px] bg-indigo-100 text-indigo-700 
                                                                          border border-indigo-200 leading-none truncate">
                                                                        {tag}
                                                                      </span>
                                                                    ))}
                                                                </div>
                                                            </div>`;

content = content.replace(oldLayout, newLayout);
fs.writeFileSync(file, content);
