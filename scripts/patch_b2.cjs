const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../client/src/pages/calendar.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add internalLabels declaration
const statusLabelsDecl = `                                            let statusLabels: string[] = parseStatusTags(evt.rawPayload?.statusTags)
                                                .map(t => t.replace(/^STATE:/i, ""))
                                                .filter(t => t.length > 0);`;
const internalLabelsDecl = `                                            let statusLabels: string[] = parseStatusTags(evt.rawPayload?.statusTags)
                                                .map(t => t.replace(/^STATE:/i, ""))
                                                .filter(t => t.length > 0);
                                            const internalLabels = parseStatusTags(evt.rawPayload?.internalTags);`;
content = content.replace(statusLabelsDecl, internalLabelsDecl);

// 2. Remove overflow-hidden
content = content.replace(
  '<div className="flex items-center gap-1 overflow-hidden">',
  '<div className="flex items-center gap-1 flex-wrap">'
);

// 3. Render internal labels
const statusLabelsRender = `                                                                    <div className="flex flex-wrap gap-1" title={statusLabels.join(", ")}>
                                                                        {statusLabels.map(s => {
                                                                        const color = getStatusColor(s, activityStatuses);
                                                                        return (
                                                                            <div key={s} className="text-[8px] font-bold uppercase tracking-wider leading-none truncate px-1 py-[1.5px] rounded-[2px]" style={color ? { backgroundColor: \`\${color}15\`, color, border: \`0.5px solid \${color}40\` } : { color: s === "ATTIVO" ? "#15803d" : "#b91c1c" }}>
                                                                                {s}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    </div>`;

const newRender = `                                                                    <div className="flex flex-wrap gap-1" title={statusLabels.join(", ")}>
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
                                                                    </div>`;

content = content.replace(statusLabelsRender, newRender);

fs.writeFileSync(file, content);
