const fs = require('fs');
let content = fs.readFileSync('client/src/pages/planning.tsx', 'utf8');

const oldLogic = `        // 2. Assign aggregated breakdown (repeated weekly within boundaries)
        const breakdown = getActivitiesBreakdownForDate(cellDate, cellDayOfWeek);
        if (!resolvedHolidayName) { // Optionally don't show normal daily routine on National Holidays
            const dateStr = format(cellDate, "yyyy-MM-dd");
            const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const isPastMonthCell = cellDate < currentMonthStart;
            
            Object.entries(breakdown).forEach(([key, count]) => {
                if (count > 0) {
                    let colorClass = "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300";
                    if (key === 'Corsi') {
                        colorClass = isPastMonthCell 
                            ? "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
                    }
                    else if (key === 'Allenamenti') colorClass = "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100";
                    else if (key === 'Lez. Individuali') colorClass = "bg-green-50 border-green-200 text-green-600 hover:bg-green-100";
                    else if (key === 'Workshop') colorClass = "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100";
                    else if (key === 'Affitti/Sale') colorClass = "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100";

                    cellEvents.push(
                        <Link to={\`/calendario-attivita?date=\${dateStr}\`} key={\`breakdown-\${key}\`}>
                            <div className={\`mb-1 mt-0.5 rounded border px-1 py-0.5 text-[11px] font-medium shadow-sm transition-colors truncate cursor-pointer \${colorClass}\`}>
                                {key} ({count})
                            </div>
                        </Link>
                    );
                }
            });
        }`;

const newLogic = `        // 2. Assign aggregated breakdown (repeated weekly within boundaries)
        const breakdown = getActivitiesBreakdownForDate(cellDate, cellDayOfWeek);
        
        const dateStr = format(cellDate, "yyyy-MM-dd");
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const isPastMonthCell = cellDate < currentMonthStart;
        
        Object.entries(breakdown).forEach(([key, count]) => {
            if (count > 0) {
                let colorClass = "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300";
                if (key === 'Corsi') {
                    colorClass = isPastMonthCell 
                        ? "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300" 
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
                }
                else if (key === 'Allenamenti') colorClass = "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100";
                else if (key === 'Lez. Individuali') colorClass = "bg-green-50 border-green-200 text-green-600 hover:bg-green-100";
                else if (key === 'Workshop') colorClass = "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100";
                else if (key === 'Affitti/Sale') colorClass = "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100";

                cellEvents.push(
                    <Link to={\`/calendario-attivita?date=\${dateStr}\`} key={\`breakdown-\${key}\`}>
                        <div className={\`mb-1 mt-0.5 rounded border px-1 py-0.5 text-[11px] font-medium shadow-sm transition-colors truncate cursor-pointer \${colorClass}\`}>
                            {key} ({count})
                        </div>
                    </Link>
                );
            }
        });`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('client/src/pages/planning.tsx', content);
